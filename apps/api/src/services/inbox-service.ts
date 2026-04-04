import {
  InboxItemStatus,
  type InboxItem,
  type InboxItemStatusValue,
} from "@agent-kanban/contracts";
import type { PrismaClient } from "@prisma/client";
import { ApiError } from "./card-service.js";

function isInboxItemStatusValue(value: string): value is InboxItemStatusValue {
  return Object.values(InboxItemStatus).includes(value as InboxItemStatusValue);
}

function toInboxItemId(commentId: string, collaboratorId: string): string {
  return `${commentId}:${collaboratorId}`;
}

function parseInboxItemId(itemId: string): { commentId: string; collaboratorId: string } {
  const splitAt = itemId.indexOf(":");

  if (splitAt <= 0 || splitAt === itemId.length - 1) {
    throw new ApiError(400, "invalid_transition", "invalid inbox item id");
  }

  return {
    commentId: itemId.slice(0, splitAt),
    collaboratorId: itemId.slice(splitAt + 1),
  };
}

export class InboxService {
  constructor(private readonly prisma: PrismaClient) {}

  async listInbox(
    collaboratorId: string,
    status?: InboxItemStatusValue
  ): Promise<InboxItem[]> {
    if (status !== undefined && !isInboxItemStatusValue(status)) {
      throw new ApiError(400, "invalid_transition", `unsupported inbox status: ${status}`);
    }

    const items = await this.prisma.commentMention.findMany({
      where: {
        mentionedCollaboratorId: collaboratorId,
        ...(status === undefined ? {} : { status }),
      },
      include: {
        comment: {
          select: {
            cardId: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }, { commentId: "desc" }],
    });

    return items.map((item) => ({
      id: toInboxItemId(item.commentId, item.mentionedCollaboratorId),
      cardId: item.comment.cardId,
      commentId: item.commentId,
      status: item.status as InboxItemStatusValue,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  async updateStatus(itemId: string, status: InboxItemStatusValue): Promise<InboxItem> {
    if (!isInboxItemStatusValue(status)) {
      throw new ApiError(400, "invalid_transition", `unsupported inbox status: ${status}`);
    }

    const { commentId, collaboratorId } = parseInboxItemId(itemId);

    const updated = await this.prisma.commentMention.update({
      where: {
        commentId_mentionedCollaboratorId: {
          commentId,
          mentionedCollaboratorId: collaboratorId,
        },
      },
      data: {
        status,
      },
      include: {
        comment: {
          select: {
            cardId: true,
          },
        },
      },
    });

    return {
      id: toInboxItemId(updated.commentId, updated.mentionedCollaboratorId),
      cardId: updated.comment.cardId,
      commentId: updated.commentId,
      status: updated.status as InboxItemStatusValue,
      createdAt: updated.createdAt.toISOString(),
    };
  }
}
