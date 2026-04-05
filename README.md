# agent-kanban

AI-native Kanban for human + agent software delivery.

`agent-kanban` is a local-first Kanban system built for repositories where humans work in a browser and agents work from the CLI, while both operate against the same backend workflow rules.

It is opinionated on purpose:

- cards are execution units, not loose reminders
- workflow state is enforced by the backend
- card history stays understandable to humans
- agents get a stable API and CLI instead of scraping UI state

## Why This Exists

Most project boards are designed for humans only. Most agent workflows are glued together with prompts, local notes, and ad hoc scripts. `agent-kanban` sits in between:

- the repo remains the source of implementation truth
- the Kanban system remains the source of process truth
- the card remains the source of execution context

That separation makes the system usable for real software work, not just demos.

## Current Status

The current vertical slice is working locally and includes:

- PostgreSQL-backed API with enforced workflow transitions
- CLI for agent-oriented task execution
- Next.js web UI for board, card detail, inbox, and focused human card actions
- comment mentions, inbox items, audit history, and revision-aware writes
- plan import, bootstrap import, and end-to-end verification scripts

Workflow in the current slice:

`New -> Ready -> In Progress -> Done`

## Architecture

This repo is a modular monolith with three runtime surfaces:

- `apps/api` - Fastify API and Prisma-backed persistence
- `apps/cli` - agent-facing CLI that talks only to the API
- `apps/web` - human-facing Next.js UI

Shared packages:

- `packages/contracts` - API contracts and DTOs
- `packages/domain` - workflow and domain rules
- `packages/card-markdown` - card markdown parsing and validation

## Quickstart

### 1. Check local tooling

```bash
pnpm check:tooling
```

Expected local requirements:

- Node.js 24
- pnpm 10
- Docker with `docker compose`
- `psql`

### 2. Configure environment

Copy the root env file and adjust if needed:

```bash
cp .env.example .env
```

The current verification scripts assume a local Postgres running on port `5433`, so align `DATABASE_URL` and `POSTGRES_PORT` accordingly if your machine already uses `5432`.

Example:

```env
DATABASE_URL=postgresql://agent_kanban:agent_kanban@localhost:5433/agent_kanban?schema=public
POSTGRES_DB=agent_kanban
POSTGRES_USER=agent_kanban
POSTGRES_PASSWORD=agent_kanban
POSTGRES_PORT=5433
```

### 3. Start everything

```bash
pnpm start
```

That command does three things:

- builds the shared contracts and host CLI
- builds the Docker images
- starts `postgres`, `api`, and `web` with Docker Compose

Default local endpoints:

- web UI: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:3001`

### 4. Run the full test suite

```bash
pnpm test
```

### 5. Seed the initial historical cards

```bash
node scripts/backfill-initial-cards.ts
```

### 6. Run the full vertical-slice verifier

```bash
node scripts/verify-vertical-slice.mjs
```

### 7. Stop the stack when done

```bash
pnpm stop
```

## Running The Apps

The default path is `pnpm start`. If you need the lower-level commands:

Build every local package and the Docker images:

```bash
pnpm build:all
```

Start only the Compose stack:

```bash
docker compose up -d --build
```

Start the API directly on the host:

```bash
pnpm --filter @agent-kanban/api dev
```

Start the web app:

```bash
pnpm --filter @agent-kanban/web dev
```

Build the CLI:

```bash
pnpm --filter @agent-kanban/cli build
```

The web UI is meant for humans. The CLI is meant for agents and automation. Both should rely on the same backend behavior rather than duplicating workflow logic.

## Using The System

### For humans

- open the board in the web UI
- inspect card detail, comments, and timeline
- manage inbox items triggered by mentions
- move well-defined work into `Ready`
- start `Ready` work in the browser when a human is taking responsibility
- add verification comments and complete work from `In Progress` to `Done` when summary and evidence are present

### For agents

Start with the repo skill at [skills/agent-kanban/SKILL.md](skills/agent-kanban/SKILL.md). That is the agent-facing operating guide for how to pick work, interpret cards, use the CLI, handle conflicts, and move cards through the workflow correctly.

For plan-driven work, the intended loop is:

1. use superpowers skills to write or approve the spec and implementation plan in the repo
2. import executable plan tasks into Kanban cards
3. execute from cards while treating the linked plan/spec docs as planning truth

Plan import is available from the CLI:

```bash
kanban import-plan --plan docs/superpowers/plans/2026-04-04-local-first-mvp-vertical-slice.md
```

Once the CLI is built, use `kanban` commands to work against the API:

```bash
kanban list
kanban show <card-id>
kanban create
kanban assign-owner <card-id> <actor-id>
kanban set-state <card-id> <state>
kanban update-card <card-id>
kanban append-summary <card-id>
kanban comment <card-id>
kanban import-plan --plan <plan-path>
```

The CLI supports `--json` output for automation-oriented flows.

## Repo Map

```text
apps/
  api/   Fastify + Prisma backend
  cli/   agent-facing CLI
  web/   Next.js human UI
packages/
  contracts/
  domain/
  card-markdown/
bootstrap/
  initial-cards.md
docs/
  project-overview.md
  *.md product and system docs
skills/
  agent-kanban/SKILL.md
scripts/
  check-tooling.mjs
  backfill-initial-cards.ts
  verify-vertical-slice.mjs
```

## Documentation

Start here for deeper system docs:

- [Project overview](docs/project-overview.md)
- [Product](docs/product.md)
- [Architecture](docs/architecture.md)
- [Domain model](docs/domain-model.md)
- [Workflow](docs/workflow.md)
- [CLI contract](docs/cli.md)
- [Web UI](docs/web-ui.md)
- [MVP definition](docs/mvp.md)
- [Vertical-slice design spec](docs/superpowers/specs/2026-04-04-local-first-mvp-vertical-slice-design.md)
- [Vertical-slice implementation plan](docs/superpowers/plans/2026-04-04-local-first-mvp-vertical-slice.md)
- [Agent operating skill](skills/agent-kanban/SKILL.md)

## What Makes This Different

- Local-first by default. You can run, test, and verify the system entirely on your machine.
- Human and agent surfaces are separate, but the workflow contract is shared.
- The board is not treated as a passive reporting layer; it is an enforced execution system.
- Bootstrap matters. Earlier planning work can be imported into the live system and carried forward there.

## Roadmap Direction

The current slice proves the core loop. The next steps are about making it operationally stronger:

- better self-hosting and setup ergonomics
- richer board interactions without weakening backend enforcement
- stronger actor ergonomics for both humans and agents
- planning and execution that can increasingly happen inside the system itself

## Contributing

If you are exploring the repo, start by running the verifier, not by skimming architecture diagrams only:

```bash
node scripts/verify-vertical-slice.mjs
```

If you change workflow behavior, contracts, or markdown semantics, update the docs alongside the code. In this repo, the docs are part of the interface.
