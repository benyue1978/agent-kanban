import {
  CardState,
  type ActorRef,
  type BoardResponse,
  type CardDetail,
  type CardListItem,
  type ClaimedCardDetail,
  type CommentRecord,
} from "@agent-kanban/contracts";
import { getProtectedSections } from "@agent-kanban/card-markdown";
import { sortReadyCards } from "@agent-kanban/domain";
import {
  Prisma,
  type Card,
  type Comment,
  type CommentMention,
  type Collaborator,
  type PrismaClient,
} from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

interface CreateCardInput {
  descriptionMd: string;
  priority?: number | null;
  projectId: string;
  sourcePlanPath?: string | null;
  sourceSpecPath?: string | null;
  sourceTaskFingerprint?: string | null;
  sourceTaskId?: string | null;
  title: string;
}

type CardWithOwner = Card & {
  owner: Collaborator | null;
};

type CommentWithMentions = Comment & {
  mentions: CommentMention[];
};

type CardDetailRecord = CardWithOwner & {
  comments: CommentWithMentions[];
};

type ReadyCardForSorting = Extract<CardListItem, { state: typeof CardState.Ready }> & {
  readyAt: string;
};

const cardDetailInclude = {
  owner: true,
  comments: {
    include: {
      mentions: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} satisfies Prisma.CardInclude;

function toActorRef(collaborator: Collaborator | null): ActorRef | null {
  if (collaborator === null) {
    return null;
  }

  return {
    id: collaborator.id,
    kind: collaborator.kind === "agent" ? "agent" : "human",
    displayName: collaborator.displayName,
  };
}

function toCommentRecord(comments: CommentWithMentions[]): CommentRecord[] {
  return comments.map((comment) => ({
    id: comment.id,
    cardId: comment.cardId,
    authorId: comment.authorId,
    body: comment.bodyMd,
    kind: comment.kind as CommentRecord["kind"],
    mentions: comment.mentions.map((mention) => mention.mentionedCollaboratorId),
    createdAt: toIsoString(comment.createdAt),
  }));
}

function toIsoString(value: Date): string {
  return value.toISOString();
}

function getSummaryMarkdown(descriptionMd: string): string | null {
  return getProtectedSections(descriptionMd).finalSummary ?? null;
}

function toCardListItem(card: CardWithOwner): CardListItem {
  const owner = toActorRef(card.owner);
  const summaryMd = getSummaryMarkdown(card.descriptionMd);
  const base = {
    id: card.id,
    projectId: card.projectId,
    sourcePlanPath: card.sourcePlanPath,
    sourceSpecPath: card.sourceSpecPath,
    sourceTaskId: card.sourceTaskId,
    title: card.title,
    priority: card.priority,
    revision: card.revision,
    updatedAt: toIsoString(card.updatedAt),
  };

  switch (card.state) {
    case CardState.New:
      return { ...base, state: CardState.New, owner, summaryMd: null };
    case CardState.Ready:
      return { ...base, state: CardState.Ready, owner, summaryMd: null };
    case CardState.InProgress:
      if (owner === null) {
        throw new Error("In Progress cards must have an owner");
      }
      return { ...base, state: CardState.InProgress, owner, summaryMd };
    case CardState.Done:
      if (summaryMd === null) {
        throw new Error("Done cards must have a final summary");
      }
      return { ...base, state: CardState.Done, owner, summaryMd };
    default:
      throw new Error(`Unsupported card state: ${card.state}`);
  }
}

function toCardDetail(card: CardDetailRecord): CardDetail {
  return {
    ...toCardListItem(card),
    descriptionMd: card.descriptionMd,
    comments: toCommentRecord(card.comments),
  };
}

function createEmptyBoard(): BoardResponse {
  return {
    columns: {
      [CardState.New]: { state: CardState.New, cards: [] },
      [CardState.Ready]: { state: CardState.Ready, cards: [] },
      [CardState.InProgress]: { state: CardState.InProgress, cards: [] },
      [CardState.Done]: { state: CardState.Done, cards: [] },
    },
  };
}

export class CardRepository {
  constructor(private readonly prisma: DbClient) {}

  async create(input: CreateCardInput): Promise<CardDetail> {
    const card = await this.prisma.card.create({
      data: {
        projectId: input.projectId,
        title: input.title,
        descriptionMd: input.descriptionMd,
        revision: 1,
        state: CardState.New,
        priority: input.priority ?? null,
        sourceTaskId: input.sourceTaskId ?? null,
        sourceTaskFingerprint: input.sourceTaskFingerprint ?? null,
        sourcePlanPath: input.sourcePlanPath ?? null,
        sourceSpecPath: input.sourceSpecPath ?? null,
      },
      include: cardDetailInclude,
    });

    return toCardDetail(card);
  }

  async listBoard(projectId: string): Promise<BoardResponse> {
    const cards = await this.prisma.card.findMany({
      where: {
        projectId,
        archivedAt: null,
      },
      include: {
        owner: true,
      },
      orderBy: [{ updatedAt: "asc" }, { createdAt: "asc" }],
    });

    const board = createEmptyBoard();

    for (const card of cards) {
      const mapped = toCardListItem(card);
      board.columns[mapped.state].cards.push(mapped as never);
    }

    const readyCards = sortReadyCards(
      board.columns[CardState.Ready].cards.map((card) => ({
        ...card,
        readyAt: card.updatedAt,
      })) as ReadyCardForSorting[]
    ).map(({ readyAt: _readyAt, ...card }) => card);
    board.columns[CardState.Ready].cards = readyCards;

    return board;
  }

  async findById(cardId: string): Promise<CardDetail | null> {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: cardDetailInclude,
    });

    return card === null ? null : toCardDetail(card);
  }

  async findBySourceTaskId(projectId: string, sourceTaskId: string): Promise<CardDetail | null> {
    const card = await this.prisma.card.findFirst({
      where: {
        projectId,
        sourceTaskId,
      },
      include: cardDetailInclude,
    });

    return card === null ? null : toCardDetail(card);
  }

  async updateById(cardId: string, data: Prisma.CardUncheckedUpdateInput): Promise<CardDetail> {
    const card = await this.prisma.card.update({
      where: { id: cardId },
      data,
      include: cardDetailInclude,
    });

    return toCardDetail(card);
  }

  async getClaimedCard(cardId: string): Promise<ClaimedCardDetail | null> {
    const mapped = await this.findById(cardId);
    return mapped !== null && mapped.state === CardState.InProgress
      ? (mapped as ClaimedCardDetail)
      : null;
  }
}
