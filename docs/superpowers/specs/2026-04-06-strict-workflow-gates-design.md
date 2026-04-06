# Design Spec: Strict Workflow Gates

## Purpose
Tighten the software development lifecycle by enforcing mandatory quality and safety gates at critical state transitions. This ensures that work is properly planned before it starts and fully verified and persisted before it is marked as done.

## Context
Initial agent sessions showed that planning and verification steps are sometimes overlooked. We need programmatic and skill-based enforcement to maintain the integrity of the "process truth" in the Kanban system.

## Design

### 1. API Validation Logic

#### New -> Ready Gate
The `hasRequiredSections` helper in `apps/api/src/services/card-service.ts` will be updated to:
- Require `Goal`, `Context`, `Scope`, and `Definition of Done`.
- Reject sections containing placeholders: `TBD`, `TODO`, or unchecked checkboxes `[ ]`.

```typescript
function isSectionComplete(content: string): boolean {
  const placeholders = ["TBD", "TODO", "[ ]"];
  return !placeholders.some(p => content.includes(placeholder));
}
```

#### In Progress -> Done Gate
The `validateCompletionSummary` helper in `packages/card-markdown/src/summary.ts` will be updated to:
- Require the `Result / Links` section.
- Ensure the section contains evidence of persistence (URL or a 7+ character hex string/git hash).

### 2. Skill Revision (`skills/agent-kanban/SKILL.md`)

Add a **Workflow Mandates** section with the following "Hard Gates":

#### Implementation Gate (Standard Practice)
- **Rule**: Implementation work (writing code) MUST ONLY occur while the card is in the `In Progress` state.
- **Action**: Move card from `Ready` to `In Progress` before touching code.

#### Planning Gate (New -> Ready)
- **Rule**: A card cannot be made `Ready` until planning is finished.
- **Requirement**: Must have an approved spec/plan and a detailed, placeholder-free description.

#### Completion Gate (In Progress -> Done)
- **Rule**: A card cannot be made `Done` until the work is fully verified and pushed.
- **Requirement**: Must pass all tests, commit all changes, push to origin, and provide a `Final Summary` with links/hashes.

## Verification Plan

### Automated Tests
- Update `packages/card-markdown/tests/card-markdown.test.ts` to verify placeholder rejection and summary link validation.
- Update `apps/api/tests/integration/workflow-routes.test.ts` to verify that `New -> Ready` fails without a complete description.

### Manual Verification
- Attempt to move a card with "TBD" in the description to `Ready` via CLI.
- Attempt to move a card to `Done` without a `Result / Links` section in the summary.
