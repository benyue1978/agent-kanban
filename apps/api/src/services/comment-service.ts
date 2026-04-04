import {
  CommentKind,
  type AddCommentRequest,
  type AddCommentResponse,
  type CommentKindValue,
} from "@agent-kanban/contracts";
import type { PrismaClient } from "@prisma/client";
import { ApiError } from "./card-service.js";

function isCommentKindValue(value: string): value is CommentKindValue {
  return Object.values(CommentKind).includes(value as CommentKindValue);
}

function extractMentionHandles(body: string): string[] {
  const matches = body.matchAll(/(^|\s)@([a-z0-9][a-z0-9-]*)/gi);
  return [
    ...new Set(
      Array.from(matches, (match) => match[2]?.toLowerCase()).filter(
        (handle): handle is string => handle !== undefined
      )
    ),
  ];
}

export class CommentService {
  constructor(private readonly prisma: PrismaClient) {}

  async addComment(
    cardId: string,
    input: Omit<AddCommentRequest, "cardId">
  ): Promise<AddCommentResponse["comment"]> {
    if (!isCommentKindValue(input.kind)) {
      throw new ApiError(400, "invalid_transition", `unsupported comment kind: ${input.kind}`);
    }

    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      select: {
        id: true,
        projectId: true,
      },
    });

    if (card === null) {
      throw new ApiError(404, "invalid_transition", "card not found");
    }

    const author = await this.prisma.collaborator.findUnique({
      where: { id: input.authorId },
      select: { id: true },
    });

    if (author === null) {
      throw new ApiError(404, "forbidden_action", "author not found");
    }

    const mentionHandles = extractMentionHandles(input.body);
    const mentionedCollaborators =
      mentionHandles.length === 0
        ? []
        : await this.prisma.collaborator.findMany({
            where: {
              id: {
                in: mentionHandles,
              },
            },
            select: {
              id: true,
            },
          });

    const mentionIds = mentionedCollaborators.map((collaborator) => collaborator.id);

    const comment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.comment.create({
        data: {
          cardId,
          authorId: input.authorId,
          kind: input.kind,
          bodyMd: input.body,
          mentions: {
            create: mentionIds.map((mentionedCollaboratorId) => ({
              mentionedCollaboratorId,
              status: "open",
            })),
          },
        },
        include: {
          mentions: true,
        },
      });

      await tx.event.create({
        data: {
          projectId: card.projectId,
          cardId,
          actorId: input.authorId,
          type: "comment_added",
          payloadJson: {
            commentId: created.id,
            kind: input.kind,
            mentionIds,
          },
        },
      });

      return created;
    });

    return {
      id: comment.id,
      cardId: comment.cardId,
      authorId: comment.authorId,
      body: comment.bodyMd,
      kind: comment.kind as CommentKindValue,
      mentions: comment.mentions.map((mention) => mention.mentionedCollaboratorId),
      createdAt: comment.createdAt.toISOString(),
    };
  }
}
