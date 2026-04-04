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
import type { PrismaClient } from "@prisma/client";
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

function asProjectPolicy(value: unknown): ProjectPolicy {
  return (value ?? defaultProjectPolicy) as ProjectPolicy;
}

function isCardStateValue(value: string): value is CardStateValue {
  return Object.values(CardState).includes(value as CardStateValue);
}

function workflowErrorToApiError(error: WorkflowDomainError): ApiError {
  return new ApiError(400, error.code, error.message, error.details);
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
    return this.cards.create(input);
  }

  async assignOwner(cardId: string, revision: number, ownerId: string | null): Promise<CardDetail> {
    const card = await this.getCard(cardId);

    if (card.revision !== revision) {
      throw new ApiError(409, "revision_conflict", "stale revision for owner assignment");
    }

    return this.cards.updateById(cardId, {
      ownerId,
      revision: {
        increment: 1,
      },
    });
  }

  async updateMarkdown(cardId: string, revision: number, descriptionMd: string): Promise<CardDetail> {
    const card = await this.getCard(cardId);

    if (card.revision !== revision) {
      throw new ApiError(409, "revision_conflict", "stale revision for markdown update");
    }

    return this.cards.updateById(cardId, {
      descriptionMd,
      revision: {
        increment: 1,
      },
    });
  }

  async appendSummary(cardId: string, revision: number, summaryMd: string): Promise<CardDetail> {
    const card = await this.getCard(cardId);

    if (card.revision !== revision) {
      throw new ApiError(409, "revision_conflict", "stale revision for summary update");
    }

    const descriptionMd = appendCompletionSummary(card.descriptionMd, summaryMd);

    return this.cards.updateById(cardId, {
      descriptionMd,
      revision: {
        increment: 1,
      },
    });
  }

  async setState(
    cardId: string,
    input: {
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
        project: true,
        owner: true,
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

    if (targetState === CardState.InProgress) {
      if (input.ownerId === undefined) {
        throw new ApiError(400, "missing_owner", "ownerId is required to claim a card");
      }

      if (currentState !== CardState.Ready) {
        throw new ApiError(409, "claim_conflict", "card is no longer claimable");
      }

      const policy = asProjectPolicy(existing.project.policyJson);

      try {
        canTransition({
          from: currentState,
          to: CardState.InProgress,
          actorKind: "agent",
          actorId: input.ownerId,
          ownerId: existing.ownerId,
          targetOwnerId: input.ownerId,
          humanInstructionGranted: true,
          policy,
        });
      } catch (error) {
        if (error instanceof WorkflowDomainError) {
          throw workflowErrorToApiError(error);
        }
        throw error;
      }

      const result = await this.prisma.card.updateMany({
        where: {
          id: cardId,
          state: CardState.Ready,
        },
        data: {
          ownerId: input.ownerId,
          state: CardState.InProgress,
          revision: {
            increment: 1,
          },
        },
      });

      if (result.count === 0) {
        throw new ApiError(409, "claim_conflict", "card is no longer claimable");
      }

      return this.getCard(cardId);
    }

    const descriptionSections = getProtectedSections(existing.descriptionMd);

    try {
        canTransition({
        from: currentState,
        to: targetState,
        actorKind: "human",
        actorId: existing.ownerId ?? "human-reviewer",
        ownerId: existing.ownerId,
        requiredSectionsPresent: Boolean(
          existing.title.length > 0 &&
            descriptionSections.goal &&
            descriptionSections.scope &&
            descriptionSections.definitionOfDone
        ),
        titlePresent: existing.title.length > 0,
        executionResultPresent: true,
        reviewRationalePresent: true,
        reviewGatePassed: true,
        summaryPresent: descriptionSections.finalSummary !== undefined,
        dodCheckPresent: descriptionSections.finalSummaryDodCheck !== undefined,
      });
    } catch (error) {
      if (error instanceof WorkflowDomainError) {
        throw workflowErrorToApiError(error);
      }
      throw error;
    }

    if (targetState === CardState.Done) {
      validateCompletionSummary(existing.descriptionMd);
    }

    return this.cards.updateById(cardId, {
      state: targetState,
      revision: {
        increment: 1,
      },
    });
  }
}
