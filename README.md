# agent-kanban

AI-native Kanban for human + agent collaboration.

## What it is

agent-kanban is a software development Kanban system designed for teams where collaborators can be humans or AI agents.

The system is built around a few core ideas:

- **Repo is authoritative for code and artifacts**
- **Kanban is authoritative for task process and progress**
- **Card is the execution harness** for a task or feature
- **Agents use CLI** to interact with the system
- **Humans use a web UI** to review work, understand project state, and make selected edits

This is not a workflow engine and not an autonomous orchestrator. It is a Kanban tool that is AI-native.

## Product definition

One Kanban equals one project.

A project is usually bound to one Git repository. The repository manages source code, project documents, and artifacts. The Kanban manages the collaboration process, task state, and execution history.

A system can contain multiple projects, therefore multiple Kanban boards.

Each board contains cards. A card is usually a feature or task. A card gives collaborators the context needed to work on that task.

## Core principles

1. **Source of truth is layered**

   * The repo is authoritative for code, tests, design docs, and artifacts.
   * The Kanban system is authoritative for task state, ownership, comments, and process history.
   * Before MVP exists, planning may live in repo markdown docs. After bootstrapping, active task planning should move into the Kanban system.

2. **Card is the execution harness**

   * A card contains goal, context, scope, constraints, definition of done, and final summary.
   * A card should give an agent enough context to work, except for code itself.

3. **Kanban is the process layer**

   * Kanban shows progress, ownership, comments, review gates, and history.
   * Kanban helps humans understand what is happening and helps agents work in a controlled loop.

4. **Agent via CLI, human via web UI**

   * Agents read and write through CLI or API.
   * Humans primarily use a full web UI.

5. **Event log first**

   * Every important action should be recorded as history.
   * In V1, event history is for audit and timeline visibility, not full event-sourced reconstruction.

## Actor model

The only real actor types in the system are:

- human
- agent

The system does not introduce extra first-class actor roles such as reviewer. Review is modeled as an allowed action under workflow and project policy.

## Workflow direction

Cards move through a lightweight but enforced lifecycle:

New → Ready → In Progress → In Review → Done

V1 does not include:

- multi-owner cards
- blocked state
- workflow engine
- deep GitHub PR policy management inside the Kanban system

## Bootstrapping goal

The MVP is not only to make the system usable.

The real bar is that once the system is up and running, the repo owner can install the skill in Codex, backfill earlier work into cards, and then use cards to plan and execute future work for the system itself.

That means the system must become able to manage its own future development.

## Initial document map

- `docs/product.md` — product scope, concepts, and user model
- `docs/domain-model.md` — entities, relationships, lifecycle, and rules
- `docs/architecture.md` — technical architecture and responsibilities
- `docs/card-spec.md` — card structure, markdown template, summary rules
- `docs/workflow.md` — workflow rules, state transitions, and action policy
- `docs/comment-model.md` — comment kinds, inbox semantics, and summary boundary
- `docs/markdown-model.md` — markdown update rules, revision checks, and partial commands
- `docs/source-of-truth.md` — layered source-of-truth model
- `docs/bootstrapping.md` — how the system goes from repo-first planning to self-management
- `docs/cli.md` — CLI and agent interaction model
- `docs/web-ui.md` — human-facing web UI requirements
- `docs/mvp.md` — MVP definition and self-hosting / bootstrapping criteria
- `skills/SKILL.md` — agent protocol for using the system

## Tech choices

- Backend: Node.js
- CLI: Node.js
- Frontend: Next.js
- Database: PostgreSQL

## Non-goals for V1

- No multi-owner card model
- No blocked state
- No workflow engine
- No deep GitHub branch/PR policy management in the Kanban itself
- No requirement that all edits happen in the web UI
- No real-time collaborative markdown editing

## Current direction

The system should feel closer to a Linear-like project board for humans, but with a strong harness layer so that agents can reliably read context, execute work, update state, and leave behind understandable history.

The design goal is to stay simple in model shape, but strict in execution rules.
