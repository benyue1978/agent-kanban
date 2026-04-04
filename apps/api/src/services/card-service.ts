import {
  appendCompletionSummary,
  getProtectedSections,
  validateCompletionSummary,
} from "@agent-kanban/card-markdown";
import {
  CardState,
  defaultProjectPolicy,
  type BoardResponse,
  type CardStateValue,
  type CardDetail,
  type CreateCardRequest,
  type ProjectCreateRequest,
  type ProjectDetail,
  type ProjectPolicy,
} from "@agent-kanban/contracts";
import { WorkflowDomainError, canTransition } from "@agent-kanban/domain";
import type { Prisma, PrismaClient } from "@prisma/client";
import { CardRepository } from "../repositories/card-repository.js";
import { ProjectRepository } from "../repositories/project-repository.js";

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    readonly code:
      | "invalid_transition"
      | "missing_owner"
      | "missing_required_section"
      | "review_gate_not_passed"
      | "summary_required"
      | "forbidden_action"
      | "revision_conflict"
      | "claim_conflict",
    message: string,
    readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type EventType =
  | "card_created"
  | "owner_assigned"
  | "state_changed"
  | "markdown_updated"
  | "summary_updated";

type EventActor = {
  id: string;
  kind: "human" | "agent";
};

function asProjectPolicy(value: unknown): ProjectPolicy {
  return (value ?? defaultProjectPolicy) as ProjectPolicy;
}

function isCardStateValue(value: string): value is CardStateValue {
  return Object.values(CardState).includes(value as CardStateValue);
}

function workflowErrorToApiError(error: WorkflowDomainError): ApiError {
  return new ApiError(400, error.code, error.message, error.details);
}

async function findActor(
  prisma: PrismaClient,
  actorId: string | null | undefined
): Promise<EventActor | null> {
  if (actorId === undefined || actorId === null) {
    return null;
  }

  const actor = await prisma.collaborator.findUnique({
    where: { id: actorId },
    select: {
      id: true,
      kind: true,
    },
  });

  if (actor === null) {
    throw new ApiError(404, "forbidden_action", `actor not found: ${actorId}`);
  }

  return {
    id: actor.id,
    kind: actor.kind === "agent" ? "agent" : "human",
  };
}

async function resolveActor(
  prisma: PrismaClient,
  ...candidateActorIds: Array<string | null | undefined>
): Promise<EventActor | null> {
  for (const candidateActorId of candidateActorIds) {
    const actor = await findActor(prisma, candidateActorId);

    if (actor !== null) {
      return actor;
    }
  }

  return null;
}

async function createEvent(
  tx: Prisma.TransactionClient,
  input: {
    actorId: string | null;
    cardId: string;
    payloadJson: Prisma.InputJsonValue;
    projectId: string;
    type: EventType;
  }
): Promise<void> {
  if (input.actorId === null) {
    return;
  }

  await tx.event.create({
    data: {
      projectId: input.projectId,
      cardId: input.cardId,
      actorId: input.actorId,
      type: input.type,
      payloadJson: input.payloadJson,
    },
  });
}

function hasRequiredSections(title: string, descriptionMd: string): boolean {
  const sections = getProtectedSections(descriptionMd);
  return Boolean(title.length > 0 && sections.goal && sections.scope && sections.definitionOfDone);
}

export class CardService {
  private readonly cards: CardRepository;
  private readonly projects: ProjectRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.cards = new CardRepository(prisma);
    this.projects = new ProjectRepository(prisma);
  }

  async createProject(input: Partial<ProjectCreateRequest>): Promise<ProjectDetail> {
    if (typeof input.name !== "string" || typeof input.repoUrl !== "string") {
      throw new ApiError(400, "missing_required_section", "name and repoUrl are required");
    }

    return this.projects.create({
      name: input.name,
      repoUrl: input.repoUrl,
      description: input.description ?? null,
      policy: input.policy ?? defaultProjectPolicy,
    });
  }

  async getBoard(projectId: string): Promise<BoardResponse> {
    return this.cards.listBoard(projectId);
  }

  async getCard(cardId: string): Promise<CardDetail> {
    const card = await this.cards.findById(cardId);

    if (card === null) {
      throw new ApiError(404, "invalid_transition", "card not found");
    }

    return card;
  }

  async createCard(input: CreateCardRequest): Promise<CardDetail> {
    const actor = await resolveActor(this.prisma, input.actorId);

    const card = await this.prisma.$transaction(async (tx) => {
      const created = await new CardRepository(tx as PrismaClient).create(input);

      await createEvent(tx, {
        actorId: actor?.id ?? null,
        cardId: created.id,
        projectId: created.projectId,
        type: "card_created",
        payloadJson: {
          state: created.state,
        },
      });

      return created;
    });

    return card;
  }

  async assignOwner(
    cardId: string,
    revision: number,
    ownerId: string | null,
    actorId?: string
  ): Promise<CardDetail> {
    const existing = await this.prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        ownerId: true,
        projectId: true,
        revision: true,
      },
    });

    if (existing === null) {
      throw new ApiError(404, "invalid_transition", "card not found");
    }

    if (existing.revision !== revision) {
      throw new ApiError(409, "revision_conflict", "stale revision for owner assignment");
    }

    const actor = await resolveActor(this.prisma, actorId, existing.ownerId, ownerId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await new CardRepository(tx as PrismaClient).updateById(cardId, {
        ownerId,
        revision: {
          increment: 1,
        },
      });

      await createEvent(tx, {
        actorId: actor?.id ?? null,
        cardId,
        projectId: existing.projectId,
        type: "owner_assigned",
        payloadJson: {
          previousOwnerId: existing.ownerId,
          ownerId,
        },
      });

      return updated;
    });
  }

  async updateMarkdown(
    cardId: string,
    revision: number,
    descriptionMd: string,
    actorId?: string
  ): Promise<CardDetail> {
    const existing = await this.prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        ownerId: true,
        projectId: true,
        revision: true,
      },
    });

    if (existing === null) {
      throw new ApiError(404, "invalid_transition", "card not found");
    }

    if (existing.revision !== revision) {
      throw new ApiError(409, "revision_conflict", "stale revision for markdown update");
    }

    const actor = await resolveActor(this.prisma, actorId, existing.ownerId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await new CardRepository(tx as PrismaClient).updateById(cardId, {
        descriptionMd,
        revision: {
          increment: 1,
        },
      });

      await createEvent(tx, {
        actorId: actor?.id ?? null,
        cardId,
        projectId: existing.projectId,
        type: "markdown_updated",
        payloadJson: {
          revision: updated.revision,
        },
      });

      return updated;
    });
  }

  async appendSummary(
    cardId: string,
    revision: number,
    summaryMd: string,
    actorId?: string
  ): Promise<CardDetail> {
    const existing = await this.prisma.card.findUnique({
      where: { id: cardId },
      select: {
        descriptionMd: true,
        ownerId: true,
        projectId: true,
        revision: true,
      },
    });

    if (existing === null) {
      throw new ApiError(404, "invalid_transition", "card not found");
    }

    if (existing.revision !== revision) {
      throw new ApiError(409, "revision_conflict", "stale revision for summary update");
    }

    const descriptionMd = appendCompletionSummary(existing.descriptionMd, summaryMd);
    const actor = await resolveActor(this.prisma, actorId, existing.ownerId);

    return this.prisma.$transaction(async (tx) => {
      const updated = await new CardRepository(tx as PrismaClient).updateById(cardId, {
        descriptionMd,
        revision: {
          increment: 1,
        },
      });

      await createEvent(tx, {
        actorId: actor?.id ?? null,
        cardId,
        projectId: existing.projectId,
        type: "summary_updated",
        payloadJson: {
          revision: updated.revision,
        },
      });

      return updated;
    });
  }

  async setState(
    cardId: string,
    input: {
      actorId?: string;
      ownerId?: string;
      revision?: number;
      to: string;
    }
  ): Promise<CardDetail> {
    if (!isCardStateValue(input.to)) {
      throw new ApiError(400, "invalid_transition", `unsupported target state: ${input.to}`);
    }

    const targetState = input.to;
    const existing = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        owner: true,
        project: true,
      },
    });

    if (existing === null) {
      throw new ApiError(404, "invalid_transition", "card not found");
    }

    if (!isCardStateValue(existing.state)) {
      throw new ApiError(400, "invalid_transition", `unsupported current state: ${existing.state}`);
    }

    const currentState = existing.state;

    if (input.revision !== undefined && input.revision !== existing.revision) {
      throw new ApiError(409, "revision_conflict", "stale revision for state transition");
    }

    if (targetState === CardState.InProgress && input.ownerId !== undefined) {
      const claimOwnerId = input.ownerId;

      if (currentState !== CardState.Ready) {
        throw new ApiError(409, "claim_conflict", "card is no longer claimable");
      }

      const actor = await resolveActor(this.prisma, input.actorId, claimOwnerId);

      try {
        canTransition({
          from: currentState,
          to: CardState.InProgress,
          actorKind: actor?.kind ?? "agent",
          actorId: actor?.id ?? claimOwnerId,
          ownerId: existing.ownerId,
          targetOwnerId: claimOwnerId,
          humanInstructionGranted: true,
          policy: asProjectPolicy(existing.project.policyJson),
        });
      } catch (error) {
        if (error instanceof WorkflowDomainError) {
          throw workflowErrorToApiError(error);
        }
        throw error;
      }

      await this.prisma.$transaction(async (tx) => {
        const result = await tx.card.updateMany({
          where: {
            id: cardId,
            state: CardState.Ready,
          },
          data: {
            ownerId: claimOwnerId,
            state: CardState.InProgress,
            revision: {
              increment: 1,
            },
          },
        });

        if (result.count === 0) {
          throw new ApiError(409, "claim_conflict", "card is no longer claimable");
        }

        await createEvent(tx, {
          actorId: actor?.id ?? claimOwnerId,
          cardId,
          projectId: existing.projectId,
          type: "state_changed",
          payloadJson: {
            from: currentState,
            to: CardState.InProgress,
            ownerId: claimOwnerId,
          },
        });
      });

      return this.getCard(cardId);
    }

    const actor = await resolveActor(this.prisma, input.actorId, existing.ownerId);
    const transitionInput = {
      from: currentState,
      to: targetState,
      actorKind: actor?.kind ?? "human",
      ownerId: existing.ownerId,
      requiredSectionsPresent: hasRequiredSections(existing.title, existing.descriptionMd),
      titlePresent: existing.title.length > 0,
      executionResultPresent: true,
      reviewRationalePresent: true,
      reviewGatePassed: true,
      summaryPresent: getProtectedSections(existing.descriptionMd).finalSummary !== undefined,
      dodCheckPresent: getProtectedSections(existing.descriptionMd).finalSummaryDodCheck !== undefined,
      policy: asProjectPolicy(existing.project.policyJson),
      ...(actor?.id === undefined ? {} : { actorId: actor.id }),
    };

    try {
      canTransition(transitionInput);
    } catch (error) {
      if (error instanceof WorkflowDomainError) {
        throw workflowErrorToApiError(error);
      }
      throw error;
    }

    if (targetState === CardState.Done) {
      validateCompletionSummary(existing.descriptionMd);
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await new CardRepository(tx as PrismaClient).updateById(cardId, {
        state: targetState,
        revision: {
          increment: 1,
        },
      });

      await createEvent(tx, {
        actorId: actor?.id ?? null,
        cardId,
        projectId: existing.projectId,
        type: "state_changed",
        payloadJson: {
          from: currentState,
          to: targetState,
          ownerId: updated.owner?.id ?? null,
        },
      });

      return updated;
    });
  }
}
