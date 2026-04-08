---
name: agent-kanban
description: Use when agents need to interact with the agent-kanban system to pick work, execute tasks, update card state, record progress, and complete cards within the repo-backed workflow
---

## Overview

This skill defines how an agent should interact with the agent-kanban system.

## Agent Quick Start

Before starting any work, verify your environment:

1. **Discovery**: `kanban discovery --json`
2. **Find IDs**: `kanban collaborators list --json`
3. **Check Configuration**: `kanban config --json`
4. **Smoke Test**: `kanban cards list --json`

Use a local `.kanban.json` for defaults:
```json
{
  "apiUrl": "http://127.0.0.1:3001",
  "actorId": "agent",
  "projectId": "cmnlv..."
}
```

## Core Principles

1. **Repo is implementation truth** - code, tests, docs are authoritative
2. **Kanban is process truth** - state, ownership, comments live in Kanban
3. **Comments are timeline** - record progress, do not replace Final Summary
4. **Quality descriptions required** - every card MUST have Goal, Context, Scope, Definition of Done (see `assets/card-template.md`)
5. **Final Summary required before Done** - includes What was done, Result/Links, DoD Check
6. **Safety first** - never test against production; verify DATABASE_URL targets port 5434/dev

## Workflow Behavior

### State Machine
Cards MUST follow this sequence:
```
New → Ready → In Progress → In Review → Done
```
CLI state slugs: `new`, `ready`, `in-progress`, `in-review`, `done`

### New → Ready
**Requirements:**
- Card description MUST include: `## Goal`, `## Context`, `## Scope`, `## Definition of Done`
- These are PLANNING sections (NOT Final Summary - Final Summary is only for Done)
- Transition MUST use `--actor human`: `kanban cards set-state --id <id> --to ready --actor human --revision <n> --json`

**If you get `missing_required_section` error:**
1. Fetch card: `kanban cards show --id <id> --json`
2. Check description has Goal, Context, Scope, Definition of Done
3. If missing, update: `kanban cards update --id <id> --file card.md --revision <n> --json`
4. Retry with `--actor human`

### Ready → In Progress
- Claim with `kanban cards set-state --id <id> --to in-progress --owner agent --revision <n> --json`
- No implementation until card is In Progress

### In Progress → In Review
- Move to In Review only after implementation is complete and tests pass
- **MANDATORY**: Spawn a subagent to review code changes. This CANNOT be skipped.
  `kanban cards set-state --id <id> --to in-review --owner agent --revision <n> --json`

### In Review
1. Spawn reviewer subagent immediately (not optional)
2. Document all findings as comments: `kanban cards comment --id <id> --body "..." --kind note --author agent --json`
3. If issues found: move back to In Progress, fix, re-review
4. If review passes: move to Done

### In Review → Done
**Requirements:**
- Final Summary exists with `### What was done`, `### Result / Links`, `### DoD Check`
- Verification evidence recorded as `verification` kind comment

### Listing Cards
- **New cards**: `kanban cards list --project <id> --state new` (no `--assigned-to` - new cards have no owner)
- **Ready cards**: `kanban cards list --project <id> --state ready`
- **My cards**: `kanban cards list --project <id> --state in-progress --assigned-to agent`
- **In review**: `kanban cards list --project <id> --state in-review`

NEVER use `--assigned-to` with `--state new` - it will always return empty.

## Structured Commands

### Set state
`kanban cards set-state --id <id> --to <state> --owner <owner-id> --actor <actor-id> --revision <n> --json`

### Assign owner
`kanban cards assign-owner --id <id> --to <owner-id|none> --json`

### Append/Replace summary
`kanban cards append-summary --id <id> --file summary.md --json`

Use `--replace` to overwrite the entire Final Summary instead of appending:
`kanban cards append-summary --id <id> --file summary.md --replace --json`

This is useful when the Final Summary has duplicate sections or incorrect content.

### Update card (full edit)
```
kanban cards show --id <id> --json > card.md
# edit card.md
kanban cards update --id <id> --file card.md --revision <n> --json
```

### Add comment
`kanban cards comment --id <id> --body "..." --kind <progress|question|decision|note|verification> --author <id> --json`

## Comment Usage

| Kind | Use for |
|------|---------|
| `progress` | implementation done, tests added, artifact created |
| `question` | asking human for decision, clarification needed |
| `decision` | design decision, review outcome, direction change |
| `note` | handoff, minor context |
| `verification` | test output, screenshots, logs as evidence |

If a decision affects final understanding, reflect it in Final Summary before Done.

## Conflict Handling

Common errors: `invalid_translict`, `missing_owner`, `missing_required_section`, `summary_required`, `forbidden_action`, `revision_conflict`, `claim_conflict`, `cli_usage_error`

| Error | Action |
|-------|--------|
| `revision_conflict` | Re-fetch card, inspect changes, re-apply |
| `claim_conflict` | Do not force takeover; choose another card |
| `missing_required_section` | Update missing section; do not bypass |
| `cli_usage_error` | Run `kanban discovery --json` to verify flags |

Use `--dry-run` to validate before destructive updates:
`kanban cards set-state --id <id> --to done --dry-run --json`

## Anti-patterns

Do not:
- Treat comments as final deliverable
- Overwrite Goal or Definition of Done casually
- Rename protected markdown headings
- Bypass structured commands for critical updates
- Create temp `.md` files in workspace root
- Move to Done without Final Summary and verification evidence
- Move to Done without linking to real commits

## Working Philosophy

The agent's job is not just to do work, but to leave the system understandable for the next reader. A good session leaves a card that a human can understand without replaying the entire conversation.
