---
name: agent-kanban
description: Use when agents need to interact with the agent-kanban system to pick work, execute tasks, update card state, record progress, and complete cards within the repo-backed workflow
---

## Overview

This skill defines how an agent should interact with the agent-kanban system.

The goal is to ensure that agents can reliably:

- pick tasks
- understand context
- execute work
- update state
- leave clear history

This skill assumes the system model defined in the repo docs.

## Normative Source

The repository docs are the normative source for system rules.

This skill operationalizes those rules for agents.

If workflow, policy, markdown, or CLI rules change in repo docs, this skill must be updated accordingly.

## Runtime Model

An agent session should understand three different things:

- `repo_url` = logical repository identity for the project
- local working directory / worktree = local execution context
- `kanban_url` = Kanban system endpoint

The agent usually works inside a local clone or worktree, but the project itself is identified by logical repo identity rather than a machine-specific path.

For the local-first default repo setup:

- `pnpm start` builds the local CLI and starts `postgres`, `api`, and `web`
- the web UI is typically at `http://127.0.0.1:3000`
- the API is typically at `http://127.0.0.1:3001`
- the agent CLI runs on the host against that API endpoint

## Connection Assumptions

An agent should have access to:

- current repo context
- target `kanban_url`
- any explicit collaborator ids needed for actions such as comments or owner assignment

These may come from:

- current working directory
- local config
- environment variables
- explicit CLI arguments

`kanban_url` is runtime/session connection config, not project identity.

## Core Principles

1. **Repo is implementation truth**

   * code, tests, docs, and artifacts in the repo are the authoritative implementation state

2. **Kanban is process truth**

   * card state, ownership, comments, and workflow history live in the Kanban system

3. **Comments are timeline, not final result**

   * comments record progress, questions, notes, and decisions
   * comments do not replace Final Summary

5. **Final Summary is required before Done**

   * important decisions affecting result understanding should be reflected there
   * readers should not need to reconstruct final state only from comment history

6. **Safety & Integrity**

   * **Production is Sacred**: Never run tests or destructive commands against the production environment.
   * **Verify Environment**: Before running tests, explicitly check `DATABASE_URL` (e.g., `printenv | grep DATABASE`). It must target port `5434` and use the `agent_kanban_dev` database name.
   * **No Manual Truncation**: Use provided test runners that respect `.env.dev`.

7. **Prefer structured commands for critical updates**


   * use structured commands for state, ownership, summary, and comments
   * use full markdown roundtrip for larger planning edits

## 1. Getting a Task

Agents can get work in two ways:

- explicit human instruction
- list and inspect assigned tasks

Examples:

`kanban projects list`
`kanban cards list --assigned-to me`
`kanban cards list --state ready`

Unless project policy explicitly allows picking unassigned Ready cards, the agent should not claim arbitrary work on its own.

If project policy allows claiming an unassigned Ready card, the agent should still follow the default selection policy and let backend enforce claim safety.

Card commands infer the current project from the checkout's git `origin` URL when possible. If inference fails or is ambiguous, run `kanban projects list` and retry with `--project <project-id>`.

## 2. Understanding a Card

Before working, focus on:

- Goal
- Context
- Scope
- Definition of Done
- Constraints
- Final Summary, if present
- recent comments, especially `question` and `decision`

The repo remains the source of truth for code and detailed artifacts.

The card is the source of truth for task process and execution framing.

## 3. Recommended Execution Flow

Typical agent flow:

1. identify the target card
2. read card content
3. inspect current repo state
4. claim or confirm ownership if needed
5. perform work in repo
6. leave progress comments
7. update summary
8. add verification evidence when the task is complete enough
9. move card through workflow

If the task came from an approved implementation plan, also inspect any linked `sourceTaskId`, plan path, and spec path on the card before making execution choices.

Do not use a CLI plan-import command. If cards need to be created from a plan markdown file, parse the plan in the agent workflow and create cards task-by-task.

## 4. Structured Commands

Prefer these commands for critical updates:

### Set state

`kanban cards set-state --id 123 --to in-progress --owner agent-coder`

### Assign owner

`kanban cards assign-owner --id 123 --to agent-coder`

### Append summary

`kanban cards append-summary --id 123 --file summary.md`

### Add comment

`kanban cards comment --id 123 --body "..." --kind progress --author agent-coder`

Use full markdown roundtrip when editing planning content or larger descriptive sections:

`kanban cards show --id 123 > card.md`
edit locally
`kanban cards update --id 123 --file card.md --revision <known_revision>`

## 5. Comment Usage

Use comment kinds intentionally.

### `progress`

Use for:

- implementation completed
- tests added
- artifact created
- repo update summary

### `question`

Use for:

- asking human for decision
- missing requirement clarification
- ambiguous workflow blocking question

### `decision`

Use for:

- recording a design decision
- stating review outcome
- capturing direction changes

### `note`

Use for:

- handoff
- minor context
- low-importance messages

If a decision materially affects final understanding of the work, it should also be reflected in Final Summary before the card is Done.

## 6. Workflow Behavior

Cards move through:

New → Ready → In Progress → Done

Important constraints:

- do not move to In Progress without an owner
- do not move to Done without Final Summary
- do not move to Done without recorded verification evidence
- do not assume comments alone are enough for completion
- use CLI state slugs: `new`, `ready`, `in-progress`, `done`
- respect backend validation

## 7. Claiming Work Safely

Taking a card from Ready to In Progress is a claim action.

The backend may reject a claim if another actor already changed the card.

Possible conflict cases include:

- another actor already claimed the card
- card is no longer Ready
- policy does not allow the action

Handle this as normal system behavior, not as an unexpected failure.

## 8. Conflict Handling

The agent should understand and handle machine-usable errors.

Common error types may include:

- `invalid_transition`
- `missing_owner`
- `missing_required_section`
- `summary_required`
- `forbidden_action`
- `revision_conflict`
- `claim_conflict`

### Recommended behavior

#### On `revision_conflict`

- re-fetch the latest card
- inspect what changed
- re-apply the intended update safely

#### On `claim_conflict`

- do not force takeover
- re-list tasks
- choose another eligible card or wait for human instruction

#### On `missing_required_section` or `summary_required`

- update the missing section explicitly
- do not try to bypass workflow rules

## 9. Final Summary (Critical)

Before moving a card to Done:

- ensure Final Summary exists
- ensure verification evidence is present on the card timeline
- include key decisions if they matter for result interpretation
- link to relevant repo artifacts

Final Summary should answer:

- what was done
- what important decisions were made
- where the relevant artifacts live
- how completion was verified

## 10. Anti-patterns

Do not:

- treat comments as the final deliverable
- overwrite Goal or Definition of Done casually
- rename protected markdown headings
- rely on stale local card copies after conflict errors
- assume local repo path is the project identity
- bypass structured commands for critical updates unless necessary

## 11. Working Philosophy

The purpose of the agent is not only to do work, but to leave the system understandable for the next reader.

That means:

- repo should clearly reflect implementation truth
- card should clearly reflect execution truth
- comments should clearly reflect timeline
- Final Summary should clearly reflect outcome

A good agent session leaves behind a card that a human can understand without replaying the entire conversation.
