# agent-kanban

AI-native Kanban for human + agent collaboration.

## What it is

agent-kanban is a software development Kanban system designed for teams where collaborators can be humans or AI agents.

The system is built around a few core ideas:

- **Repo is the source of truth** for code, docs, artifacts, and final implementation state.
- **Card is the execution harness** for a task or feature.
- **Kanban is the process and visibility layer** for collaboration, progress, and history.
- **Agents use CLI** to interact with the system.
- **Humans use a web UI** to review work, understand project state, and make selected edits.

This is not a workflow engine and not an autonomous orchestrator. It is a Kanban tool that is AI-native.

## Product definition

One Kanban equals one project.

A project is usually bound to one Git repository. The repository manages source code, project documents, and artifacts. The Kanban manages the collaboration process, task state, and execution history.

A system can contain multiple projects, therefore multiple Kanban boards.

Each board contains cards. A card is usually a feature or task. A card gives collaborators the context needed to work on that task.

## Core principles

1. **Repo is source of truth**
   - Final implementation, design docs, tests, and artifacts live in the repo.
   - Kanban stores the process and summary, not the full implementation truth.

2. **Card is the execution harness**
   - A card contains goal, context, scope, constraints, definition of done, and final summary.
   - A card should give an agent enough context to work, except for code itself.

3. **Kanban is the process layer**
   - Kanban shows progress, ownership, comments, review gates, and history.
   - Kanban helps humans understand what is happening and helps agents work in a controlled loop.

4. **Agent via CLI, human via web UI**
   - Agents read and write through CLI or API.
   - Humans primarily use a full web UI.

5. **Event log first**
   - Every important action should be recorded as history.

## Bootstrapping goal

The MVP is not only to make the system usable.

The real bar is that once the system is up and running, the repo owner can install the skill in Codex, backfill earlier work into cards, and then use cards to plan and execute future work for the system itself.

That means the system must become able to manage its own future development.

## Initial document map

- `docs/product.md` — product scope, concepts, and user model
- `docs/domain-model.md` — entities, relationships, lifecycle, and rules
- `docs/architecture.md` — technical architecture and responsibilities
- `docs/card-spec.md` — card structure, markdown template, summary rules
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
- No complex workflow engine
- No deep GitHub branch/PR policy management in the Kanban itself
- No requirement that all edits happen in the web UI

## Current direction

The system should feel closer to a Linear-like project board for humans, but with a strong harness layer so that agents can reliably read context, execute work, update state, and leave behind understandable history.
