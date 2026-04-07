# Enforced Review Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a mandatory `In Review` state between `In Progress` and `Done` to enforce code review by a subagent.

**Architecture:** 
1. Update `CardState` enum in contracts, Prisma schema, and API logic.
2. Modify domain workflow rules to strictly enforce `In Progress <-> In Review -> Done`.
3. Update CLI to support the new `in-review` state slug.
4. Update agent skills to mandate subagent review and comment logging.

**Tech Stack:** TypeScript, Node.js, Fastify, Prisma, PostgreSQL, Commander.js.

---

### Task 1: Update Contracts and Types

**Files:**
- Modify: `packages/contracts/src/card.ts`

- [ ] **Step 1: Add `InReview` to `CardState`**

```typescript
// packages/contracts/src/card.ts

export const CardState = {
  New: "New",
  Ready: "Ready",
  InProgress: "In Progress",
  InReview: "In Review", // New state
  Done: "Done",
} as const;
```

- [ ] **Step 2: Update `CardListItem` union**

```typescript
// packages/contracts/src/card.ts

interface CardReadInReview extends CardReadBase {
  state: typeof CardState.InReview;
  owner: ActorRef;
  summaryMd: string | null;
}

export type CardListItem =
  | CardReadNew
  | CardReadReady
  | CardReadInProgress
  | CardReadInReview // Add this
  | CardReadDone;
```

- [ ] **Step 3: Update `SummaryPresentCard` type**

```typescript
// packages/contracts/src/card.ts

export type SummaryPresentCard =
  | (Extract<CardDetail, { state: typeof CardState.InProgress }> & { summaryMd: string })
  | (Extract<CardDetail, { state: typeof CardState.InReview }> & { summaryMd: string }) // Add this
  | Extract<CardDetail, { state: typeof CardState.Done }>;
```

- [ ] **Step 4: Commit changes**

```bash
git add packages/contracts/src/card.ts
git commit -m "feat(contracts): add InReview state to CardState"
```

---

### Task 2: Update Database Schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Update Prisma schema (Note: Card.state is a String in schema but we should document it)**

*The schema uses `String` for state, but the codebase assumes specific values. No change needed to `schema.prisma` file content if it's already `String`, but we should check if there are any Enums. Looking at previous `read_file`, `state` is a `String`.*

- [ ] **Step 2: Commit (even if no file change, to sync with plan)**

```bash
# If you didn't change the file because it was already a String, skip this task or just check the file.
```

---

### Task 3: Update Domain Workflow Rules

**Files:**
- Modify: `packages/domain/src/workflow.ts`

- [ ] **Step 1: Update `allowedTransitions`**

```typescript
// packages/domain/src/workflow.ts

const allowedTransitions = new Set<string>([
  `${CardState.New}=>${CardState.Ready}`,
  `${CardState.Ready}=>${CardState.InProgress}`,
  `${CardState.InProgress}=>${CardState.InReview}`, // New
  `${CardState.InReview}=>${CardState.InProgress}`, // New (loop back for fixes)
  `${CardState.InReview}=>${CardState.Done}`,       // New (must come from In Review)
  // Remove: `${CardState.InProgress}=>${CardState.Done}`, // Enforce review gate
]);
```

- [ ] **Step 2: Add validation for `InReview` transitions**

```typescript
// packages/domain/src/workflow.ts (inside canTransition)

  if (input.from === CardState.InProgress && input.to === CardState.InReview) {
      // Basic validation for moving to review
      if (input.ownerId === null || input.ownerId === undefined) {
        throwWorkflowError("missing_owner", "an owner is required before a card can be reviewed");
      }
      return;
  }

  if (input.from === CardState.InReview && input.to === CardState.Done) {
      // Reuse existing Done validation, ensuring it comes from InReview
      validateDoneTransition(input);
      return;
  }
```

- [ ] **Step 3: Update `validateDoneTransition` (refactor existing logic)**

```typescript
// packages/domain/src/workflow.ts

function validateDoneTransition(input: WorkflowTransitionInput) {
    if (input.ownerId === null || input.ownerId === undefined) {
      throwWorkflowError("missing_owner", "an owner is required before a card can be completed");
    }

    if (input.summaryPresent !== true) {
      throwWorkflowError("summary_required", "a final summary is required before a card can be completed");
    }

    if (input.dodCheckPresent !== true) {
      throwWorkflowError("missing_required_section", "a Definition of Done check is required in the final summary before completion");
    }

    if (input.verificationEvidencePresent !== true) {
      throwWorkflowError("missing_required_section", "verification evidence is required before a card can be completed");
    }
}
```

- [ ] **Step 4: Commit changes**

```bash
git add packages/domain/src/workflow.ts
git commit -m "feat(domain): enforce InReview gate in workflow"
```

---

### Task 4: Update CLI State Slugs

**Files:**
- Modify: `apps/cli/src/commands/common.ts`

- [ ] **Step 1: Add `in-review` to `stateSlugMap`**

```typescript
// apps/cli/src/commands/common.ts

const stateSlugMap = {
  done: CardState.Done,
  "in-review": CardState.InReview, // New
  "in-progress": CardState.InProgress,
  new: CardState.New,
  ready: CardState.Ready,
} as const;
```

- [ ] **Step 2: Update help text in `apps/cli/src/index.ts`**

```typescript
// apps/cli/src/index.ts

// Find instances where states are listed (e.g. set-state command)
// .option("--to <new|ready|in-progress|in-review|done>", "Target state")
```

- [ ] **Step 3: Commit changes**

```bash
git add apps/cli/src/commands/common.ts apps/cli/src/index.ts
git commit -m "feat(cli): add in-review state slug"
```

---

### Task 5: Update Card Repository (Board Layout)

**Files:**
- Modify: `apps/api/src/repositories/card-repository.ts`

- [ ] **Step 1: Update `createEmptyBoard`**

```typescript
// apps/api/src/repositories/card-repository.ts

function createEmptyBoard(): BoardResponse {
  return {
    columns: {
      [CardState.New]: { state: CardState.New, cards: [] },
      [CardState.Ready]: { state: CardState.Ready, cards: [] },
      [CardState.InProgress]: { state: CardState.InProgress, cards: [] },
      [CardState.InReview]: { state: CardState.InReview, cards: [] }, // New
      [CardState.Done]: { state: CardState.Done, cards: [] },
    },
  };
}
```

- [ ] **Step 2: Commit changes**

```bash
git add apps/api/src/repositories/card-repository.ts
git commit -m "feat(api): include In Review column in board"
```

---

### Task 6: Update Agent Skills

**Files:**
- Modify: `skills/agent-kanban/SKILL.md`

- [ ] **Step 1: Add "Mandatory Review Step" section**

```markdown
### Mandatory Review Step

Once implementation and local testing are finished, the agent MUST follow this procedure:

1. **Transition to Review**: Move the card to `In Review` state.
   `kanban cards set-state --id <card-id> --to in-review --json`

2. **Invoke Reviewer**: Spawn a specialized subagent (e.g., `codebase_investigator`) to audit the changes.
   Prompt: "Review the recent changes in [path]. Check for correctness, security, and style."

3. **Document Findings**: All issues found MUST be added as comments to the card.
   `kanban cards comment --id <card-id> --body "Finding: ..." --kind note --author agent --json`

4. **Iterate**: If fixes are needed, move back to `In Progress`, fix, and repeat.
```

- [ ] **Step 2: Update Workflow Behavior section**

```markdown
## 6. Workflow Behavior

Cards move through:
New → Ready → In Progress → In Review → Done
```

- [ ] **Step 3: Commit changes**

```bash
git add skills/agent-kanban/SKILL.md
git commit -m "docs(skills): update workflow with mandatory review step"
```

---

### Task 7: Verification and Integration Tests

**Files:**
- Modify: `apps/api/tests/integration/card-workflow.test.ts` (or similar)

- [ ] **Step 1: Add a test case for the new flow**

```typescript
it("must go through In Review before reaching Done", async () => {
  // 1. Create card, move to Ready, then In Progress
  // 2. Try moving In Progress -> Done (Expect Fail)
  // 3. Move In Progress -> In Review (Expect Pass)
  // 4. Move In Review -> Done (Expect Pass)
});
```

- [ ] **Step 2: Run tests**

Run: `pnpm --filter api test`

- [ ] **Step 3: Final Commit**

```bash
git commit -am "test(api): verify enforced review workflow"
```
