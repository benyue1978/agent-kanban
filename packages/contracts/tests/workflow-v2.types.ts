import { CardState } from "../src/card.js";
import type { CardListItem, SummaryPresentCard } from "../src/card.js";

const inReviewState = CardState.InReview;

const inReviewCard: CardListItem = {
  id: "card-1",
  projectId: "project-1",
  sourcePlanPath: null,
  sourceSpecPath: null,
  sourceTaskId: null,
  title: "Example",
  state: CardState.InReview,
  owner: {
    id: "collaborator-1",
    kind: "human",
    displayName: "Song",
  },
  priority: 1,
  revision: 1,
  updatedAt: "2026-04-04T00:00:00.000Z",
  summaryMd: "Review summary",
};

const inReviewSummaryPresent: SummaryPresentCard = {
  id: "card-1",
  projectId: "project-1",
  sourcePlanPath: null,
  sourceSpecPath: null,
  sourceTaskId: null,
  title: "Example",
  state: CardState.InReview,
  owner: {
    id: "collaborator-1",
    kind: "human",
    displayName: "Song",
  },
  priority: 1,
  revision: 1,
  updatedAt: "2026-04-04T00:00:00.000Z",
  descriptionMd: "# Example",
  summaryMd: "Review summary",
  comments: [],
};

void inReviewState;
void inReviewCard;
void inReviewSummaryPresent;
