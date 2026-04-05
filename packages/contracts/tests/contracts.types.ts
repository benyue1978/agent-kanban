import { CardState, InboxItemStatus } from "@agent-kanban/contracts";
import type {
  AddCommentRequest,
  AppendCardSummaryResponse,
  BoardColumns,
  CardDetail,
  ImportPlanTasksRequest,
  SetCardStateRequest,
} from "@agent-kanban/contracts";

const setCardStateRequest = {
  cardId: "card-1",
  revision: 7,
  to: CardState.InProgress,
  ownerId: "collaborator-1",
  actorId: "collaborator-1",
} satisfies SetCardStateRequest;

const addCommentRequest = {
  cardId: "card-1",
  authorId: "collaborator-1",
  body: "Verification completed",
  kind: "verification",
} satisfies AddCommentRequest;

const importPlanRequest = {
  actorId: "plan-import",
  tasks: [
    {
      sourcePlanPath: "docs/superpowers/plans/example.md",
      sourceSpecPath: "docs/superpowers/specs/example.md",
      sourceTaskFingerprint: "abc123",
      sourceTaskId: "docs/superpowers/plans/example.md#task-1",
      title: "Implement importer",
      descriptionMd: "# Implement importer",
      priority: 2,
    },
  ],
} satisfies ImportPlanTasksRequest;

const appendSummaryResponse = {
  card: {
    id: "card-1",
    projectId: "project-1",
    sourcePlanPath: "docs/superpowers/plans/example.md",
    sourceSpecPath: "docs/superpowers/specs/example.md",
    sourceTaskId: "docs/superpowers/plans/example.md#task-1",
    title: "Example",
    state: CardState.InProgress,
    owner: {
      id: "collaborator-1",
      kind: "human",
      displayName: "Song",
    },
    priority: 1,
    revision: 8,
    updatedAt: "2026-04-04T00:00:00.000Z",
    descriptionMd: "# Example",
    summaryMd: "Finished",
    comments: [],
  },
} satisfies AppendCardSummaryResponse;

const validDoneReadCard = {
  id: "card-1",
  projectId: "project-1",
  sourcePlanPath: "docs/superpowers/plans/example.md",
  sourceSpecPath: "docs/superpowers/specs/example.md",
  sourceTaskId: "docs/superpowers/plans/example.md#task-1",
  title: "Example",
  state: CardState.Done,
  owner: {
    id: "collaborator-1",
    kind: "human",
    displayName: "Song",
  },
  priority: 1,
  revision: 8,
  updatedAt: "2026-04-04T00:00:00.000Z",
  descriptionMd: "# Example",
  summaryMd: "Finished",
  comments: [],
} satisfies CardDetail;

// @ts-expect-error In Progress state mutation requires an owner.
const invalidProgressWithoutOwner: SetCardStateRequest = {
  cardId: "card-1",
  revision: 7,
  to: CardState.InProgress,
};

const impossibleDoneReadCard = {
  id: "card-1",
  projectId: "project-1",
  sourcePlanPath: null,
  sourceSpecPath: null,
  sourceTaskId: null,
  title: "Example",
  state: CardState.Done,
  owner: null,
  priority: 1,
  revision: 8,
  updatedAt: "2026-04-04T00:00:00.000Z",
  descriptionMd: "# Example",
  summaryMd: null,
  comments: [],
  // @ts-expect-error Done cards must carry a summary.
} satisfies CardDetail;

const validBoardColumns: BoardColumns = {
  [CardState.New]: {
    state: CardState.New,
    cards: [
      {
        id: "card-1",
        projectId: "project-1",
        sourcePlanPath: null,
        sourceSpecPath: null,
        sourceTaskId: null,
        title: "Example",
        state: CardState.New,
        owner: null,
        priority: 1,
        revision: 1,
        updatedAt: "2026-04-04T00:00:00.000Z",
        summaryMd: null,
      },
    ],
  },
  [CardState.Ready]: {
    state: CardState.Ready,
    cards: [],
  },
  [CardState.InProgress]: {
    state: CardState.InProgress,
    cards: [],
  },
  [CardState.Done]: {
    state: CardState.Done,
    cards: [],
  },
};

const inboxStatus = InboxItemStatus.Acknowledged;

void setCardStateRequest;
void addCommentRequest;
void importPlanRequest;
void appendSummaryResponse;
void validDoneReadCard;
void invalidProgressWithoutOwner;
void impossibleDoneReadCard;
void validBoardColumns;
void inboxStatus;
