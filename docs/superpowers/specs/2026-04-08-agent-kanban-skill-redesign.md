# Agent Kanban Skill Redesign

## Overview

Redesign the agent-kanban skill to be easier to follow. Current content is correct but too flat - important workflow info is buried among commands and reference material.

## Goals

- Agent reads workflow section first, always
- Each transition has clear DO/DON'T checklists
- Commands are reference material, not primary reading
- DOs and DON'Ts are embedded in transition sections, not separate

## Structure

### 1. Understanding Progress

Agent should understand the overall board at start of session - all columns, not just assigned work.

**Commands:**
- `kanban cards list --project <id> --state new` - new cards (unowned)
- `kanban cards list --project <id> --state ready` - ready to pick up
- `kanban cards list --project <id> --state in-progress` - in progress
- `kanban cards list --project <id> --state in-review` - in review
- `kanban cards list --project <id> --state done` - completed
- `kanban config --json` - check current config

### 2. Pushing Cards Through Kanban

#### New → Ready

**Agent must:**
- Collaborate with human to fill in: Goal, Context, Scope, Definition of Done
- Ensure all four sections have real content (not placeholder text)
- Get human approval on the plan
- Run: `kanban cards set-state --id <id> --to ready --actor human --revision <n> --json`

**Don't:**
- Don't transition without human sign-off on the plan
- Don't use `--actor agent` - human must own this decision
- Don't skip any of the four required sections

**If error `missing_required_section`:**
1. Fetch card: `kanban cards show --id <id> --json`
2. Check which section is missing: Goal, Context, Scope, Definition of Done
3. Update: `kanban cards update --id <id> --file card.md --revision <n> --json`
4. Retry with `--actor human`

#### Ready → In Progress

**Agent must:**
- Claim ownership: `kanban cards set-state --id <id> --to in-progress --owner <owner-id> --revision <n> --json`
- Implementation begins only after claiming

**Don't:**
- Don't start implementation before claiming the card

#### In Progress → In Review

**Agent must:**
- Verify implementation is complete and tests pass
- Spawn subagent to review code changes (MANDATORY, cannot skip): `kanban cards set-state --id <id> --to in-review --owner <owner-id> --revision <n> --json`
- Document review findings as comments

**Don't:**
- Don't skip the reviewer subagent - it's required

**If review finds issues:**
- Move back to In Progress: `kanban cards set-state --id <id> --to in-progress ...`
- Fix issues
- Re-review before moving to Done

#### In Review → Done

**Agent must:**
- Final Summary exists with:
  - ### What was done
  - ### Result / Links (commit URL, PR, etc.)
  - ### DoD Check
- Verification evidence recorded as `verification` kind comment
- Run: `kanban cards set-state --id <id> --to done --actor human --revision <n> --json`

**Don't:**
- Don't move without Final Summary
- Don't move without verification evidence (test output, logs, screenshots)
- Don't link to commits that don't exist

### 3. Command Reference

#### Discovery & Config
- `kanban discovery --json` - show available commands and flags
- `kanban config --json` - show current config

#### Card Commands
- `kanban cards list --project <id> --state <state> [--assigned-to <id>]` - list cards
- `kanban cards show --id <id> --json` - show card details
- `kanban cards create --project <id> --file card.md --json` - create card
- `kanban cards update --id <id> --file card.md --revision <n> --json` - update card
- `kanban cards append-summary --id <id> --file summary.md [--replace] --json` - append/replace summary

#### State Transitions
- `kanban cards set-state --id <id> --to <state> [--owner <id>] [--actor <id>] --revision <n> --json`

#### Comments
- `kanban cards comment --id <id> --body "..." --kind <progress|question|decision|note|verification> --author <id> --json`

#### Comment Kinds
| Kind | Use for |
|------|---------|
| `progress` | implementation done, tests added, artifact created |
| `question` | asking human for decision, clarification needed |
| `decision` | design decision, review outcome, direction change |
| `note` | handoff, minor context |
| `verification` | test output, screenshots, logs as evidence |

### 4. Quick Reference

#### State Machine
```
New → Ready → In Progress → In Review → Done
```

#### Required Fields Per Transition
| Transition | Required |
|------------|----------|
| New → Ready | Goal, Context, Scope, Definition of Done |
| Ready → In Progress | ownership claimed |
| In Progress → In Review | implementation complete, tests pass, reviewer subagent spawned |
| In Review → Done | Final Summary + verification comment |

#### Error Handling
| Error | Action |
|-------|--------|
| `revision_conflict` | Re-fetch card, inspect changes, re-apply |
| `claim_conflict` | Choose another card |
| `missing_required_section` | Complete missing section, don't bypass |
| `summary_required` | Add Final Summary before Done |
| `cli_usage_error` | Run `kanban discovery --json` to verify flags |

Use `--dry-run` to validate before destructive updates.

### 5. Anti-Patterns (Quick List)

Do not:
- Treat comments as final deliverable
- Overwrite Goal or Definition of Done casually
- Rename protected markdown headings
- Bypass structured commands for critical updates
- Create temp `.md` files in workspace root
- Move to Done without Final Summary and verification evidence
- Move to Done without linking to real commits
- Use `--actor agent` for New → Ready transition
- Skip the reviewer subagent for In Progress → In Review

## File Changes

### SKILL.md (primary skill file)

Restructure into sections:
1. Understanding Progress
2. Pushing Cards Through Kanban (New→Ready, Ready→In Progress, In Progress→In Review, In Review→Done)
3. Command Reference
4. Quick Reference

### card-template.md

Keep as-is (canonical card skeleton).

### card-spec.md

Keep as reference - explains WHY the workflow exists, not HOW to execute it.

## Self-Review

- All transitions have clear DO/DON'T checklists
- Commands are in reference section, not workflow section
- No placeholders or TBD items
- Structure matches user's requirements: Understanding Progress + Pushing Cards + DOs/DON'Ts
