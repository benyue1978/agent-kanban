# Design Spec: Enforced Review Workflow

**Status**: Draft  
**Date**: 2026-04-07  
**Author**: Gemini CLI  

## 1. Context & Problem Statement

Currently, the `agent-kanban` workflow moves directly from `In Progress` to `Done`. While "verification evidence" is required, there is no formal "Code Review" gate. To ensure higher quality and architectural consistency, a mandatory review step is needed where a second perspective (provided by a specialized subagent) audits the work before it is finalized.

## 2. Goals

- Introduce a formal `In Review` state into the Kanban system.
- Enforce a "Review-Fix Loop" where cards can move back to `In Progress` if issues are found.
- Update the `agent-kanban` skill to mandate spawning a subagent for review.
- Ensure all review findings and subsequent fixes are permanently recorded as comments for auditability.

## 3. Architecture & Data Model

### 3.1 State Machine Changes

The `CardState` enum will be updated to include `In Review`.

**Transitions**:
1.  `In Progress` → `In Review`: Triggered when the owner completes development and local testing.
2.  `In Review` → `In Progress`: Triggered if the review finds issues requiring fixes.
3.  `In Review` → `Done`: Triggered only after a successful review or after all findings are addressed.

**Prohibited Transitions**:
-   `In Progress` → `Done` (Must pass through `In Review`).
-   `Ready` → `In Review` (Must pass through `In Progress`).

### 3.2 Contract Updates (`@agent-kanban/contracts`)

- Update `CardState` constant and `CardStateValue` type.
- Update `NonClaimCardStateValue` to include `In Review`.

### 3.3 Database Changes (`apps/api/prisma/schema.prisma`)

- Update the `CardState` enum in the Prisma schema.
- Run a migration to apply the change.

### 3.4 Logic Updates (`apps/api/src/services/card-service.ts`)

- Update `canTransition` logic to enforce the new state sequence.
- Add validation to ensure `In Review` is the only path to `Done`.

## 4. Agent Skill Updates (`skills/agent-kanban/SKILL.md`)

The `agent-kanban` skill will be updated with a new section: **Mandatory Review Step**.

### 4.1 Review Procedure
1.  **Move to In Review**: Once work is complete, the agent MUST move the card to `In Review`.
2.  **Spawn Reviewer**: The agent MUST spawn a specialized subagent (e.g., `codebase_investigator`) with a prompt to: "Perform a code review of the recent changes, focusing on correctness, style, and test coverage."
3.  **Log Findings**: All findings from the subagent MUST be recorded as `note` or `question` comments.
4.  **Fix & Verify**: The agent MUST fix the issues, log a `progress` comment, and optionally re-trigger the reviewer.
5.  **Finalize**: Only after the review loop is closed can the agent move the card to `Done`.

## 5. CLI Updates (`apps/cli`)

- Update `kanban cards set-state` to support the `in-review` slug.
- Ensure help text and discovery metadata reflect the new state.

## 6. Implementation Plan (High Level)

1.  **Database & Contracts**: Update types and run Prisma migration.
2.  **API Logic**: Update transition validation in `CardService` and domain `workflow.ts`.
3.  **CLI Support**: Update state slugs and validation.
4.  **Skill Enforcement**: Update `SKILL.md` with the new mandatory steps and update the `Definition of Done` template.
5.  **Verification**: Add integration tests for the new `In Progress` <-> `In Review` -> `Done` flow.

## 7. Success Criteria

-   A card cannot be moved from `In Progress` to `Done` without entering `In Review`.
-   The CLI correctly handles the `in-review` state.
-   The `agent-kanban` skill explicitly instructs agents to use subagents for review.
-   Review findings are visible in the card comment history.
