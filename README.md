# agent-kanban

AI-native Kanban for human + agent software delivery.

`agent-kanban` is a local-first Kanban system built for repositories where humans and agents collaborate. The human provides direction and discusses design via chat, while the agent uses the Kanban system to manage tasks, record progress, and drive the workflow to completion.

It is opinionated on purpose:

- cards are execution units, not loose reminders
- workflow state is enforced by the backend
- agents operate the system via a stable API and CLI
- humans observe progress through the web UI

## Why This Exists

Most project boards are designed for humans only. Most agent workflows are glued together with prompts, local notes, and ad hoc scripts. `agent-kanban` sits in between:

- the repo remains the source of implementation truth
- the Kanban system remains the source of process truth
- the agent is the primary operator of the Kanban system
- the card remains the source of execution context

That separation makes the system usable for real software work, not just demos.

## Current Status

The current vertical slice is working locally and includes:

- PostgreSQL-backed API with enforced workflow transitions
- CLI for human and agent-oriented task execution
- Next.js web UI for observing board, card detail, and inbox
- comment mentions, inbox items, audit history, and revision-aware writes
- plan import, bootstrap import, and end-to-end verification scripts

Workflow in the current slice:

`New -> Ready -> In Progress -> Done`

## Architecture

This repo is a modular monolith with three runtime surfaces:

- `apps/api` - Fastify API and Prisma-backed persistence
- `apps/cli` - agent-facing CLI that talks to the API
- `apps/web` - human-facing Next.js UI for observation and status tracking

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

### 2. Install dependencies

Install workspace dependencies first:

```bash
pnpm install
```

Then copy the production-like root env file and the separate development env file:

```bash
cp .env.example .env
cp .env.dev.example .env.dev
```

### 3. Configure environment

This repo uses two local environments:

- `.env` for the production-like local stack started by `pnpm start`
- `.env.dev` for development, tests, and e2e started by `pnpm start:dev` and `pnpm test`

Keep them on different ports and different database names so development never writes into the production-like stack.

Example `.env`:

```env
COMPOSE_PROJECT_NAME=agent-kanban-prod
DATABASE_URL=postgresql://agent_kanban:agent_kanban@localhost:5433/agent_kanban?schema=public
POSTGRES_DB=agent_kanban
POSTGRES_USER=agent_kanban
POSTGRES_PASSWORD=agent_kanban
POSTGRES_PORT=5433
API_PORT=3001
WEB_PORT=3000
```

Example `.env.dev`:

```env
COMPOSE_PROJECT_NAME=agent-kanban-dev
DATABASE_URL=postgresql://agent_kanban:agent_kanban@localhost:5434/agent_kanban_dev?schema=public
POSTGRES_DB=agent_kanban_dev
POSTGRES_USER=agent_kanban
POSTGRES_PASSWORD=agent_kanban
POSTGRES_PORT=5434
API_PORT=3101
WEB_PORT=3100
```

### 4. Start everything

Production-like local stack:

```bash
pnpm start
```

Development stack:

```bash
pnpm start:dev
```

Those commands do three things:

- builds the shared contracts and host CLI
- builds the Docker images
- starts `postgres`, `api`, and `web` with Docker Compose

Production-like local endpoints from `.env`:

- web UI: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:3001`

Development endpoints from `.env.dev`:

- web UI: `http://127.0.0.1:3100`
- API: `http://127.0.0.1:3101`

### 5. Run the full test suite

```bash
pnpm test
```

`pnpm test` always loads `.env.dev` and should be treated as a development-only flow.

### 6. Run the full vertical-slice verifier

```bash
pnpm verify:dev
```

`pnpm verify:dev` also targets `.env.dev`.

### 7. Stop the stack when done

```bash
pnpm stop
pnpm stop:dev
```

## Running The Apps

The default production-like path is `pnpm start`. For isolated development, use `pnpm start:dev`. If you need the lower-level commands:

Build every local package and the Docker images:

```bash
pnpm build:all
```

Start only the production-like Compose stack:

```bash
node scripts/compose-stack.mjs prod up -d --build
```

Start only the development Compose stack:

```bash
node scripts/compose-stack.mjs dev up -d --build
```

Start the API directly on the host:

```bash
pnpm --filter @agent-kanban/api dev
```

When running host processes manually during development, point them at `.env.dev` so they target the isolated dev database and ports.

Start the web app:

```bash
pnpm --filter @agent-kanban/web dev
```

Build the CLI:

```bash
pnpm --filter @agent-kanban/cli build
```

Install the `kanban` command globally on the current machine:

```bash
pnpm cli:install
```

Remove the global `kanban` command again:

```bash
pnpm cli:uninstall
```

If `pnpm cli:install` fails because your shell does not know the pnpm global bin directory yet, run `pnpm setup`, restart the shell, and retry. Global install is a one-time machine setup for agent workflows. It is intentionally separate from `pnpm start` so starting the stack does not mutate global shell state.

The CLI is the primary interaction point for agents. The web UI provides a high-level view of progress and board state for humans. Both rely on the same backend behavior rather than duplicating workflow logic.

## Using The System

### For humans

- chat with the agent to create cards, discuss design, and approve implementation plans
- provide direction and clarification when asked by the agent via card comments
- use the web UI to monitor the board, card details, and overall project status

### For agents

The agent is the primary operator of the Kanban system.

Start with the repo skill at [skills/agent-kanban/SKILL.md](skills/agent-kanban/SKILL.md). That is the agent-facing operating guide for how to pick work, collaborate with humans, use the CLI, and move cards through the workflow correctly.

The agent's role is to:
- translate human instructions into Kanban tasks (cards)
- manage card state and ownership according to the workflow rules
- record decisions and progress via card comments and the final summary
- execute implementation and verification tasks within the repository

For plan-driven work, the intended loop is:

1. use superpowers skills to write or approve the spec and implementation plan in the repo
2. ask an agent to parse the plan markdown and create cards task-by-task
3. execute from cards while treating the linked plan/spec docs as planning truth

For a one-time machine-level install of the `kanban` command:

```bash
pnpm cli:install
```

After that, use the global command:

```bash
kanban --help
```

The CLI resolves its API endpoint in this order:

- `--api-url <url>`
- `KANBAN_API_URL`
- default `http://127.0.0.1:3001`

That means the production-like local stack works with no extra shell setup, while the dev stack can be targeted explicitly:

```bash
kanban projects list
kanban --api-url http://127.0.0.1:3101 projects list
```

If you do not want a global install, invoke the built CLI directly:

```bash
node apps/cli/dist/index.js --help
```

Use grouped `kanban` commands to work against the API:

```bash
kanban projects list
kanban projects create
kanban cards list
kanban cards show --id <card-id>
kanban cards create --title "..."
kanban cards assign-owner --id <card-id> --to <owner-id|none>
kanban cards set-state --id <card-id> --to ready
kanban cards update --id <card-id> --file card.md --revision <known_revision>
kanban cards append-summary --id <card-id> --file summary.md
kanban cards comment --id <card-id> --body "..." --kind note --author <collaborator-id>
```

Card commands infer the current project from the repo `origin` URL when possible. Pass `--project <project-id>` to override inference or to work outside a checked-out project repo.

`kanban projects create` also defaults from the current repo: it uses `git remote get-url origin` for `repoUrl` and derives the project name from the repository name unless you override them with flags.

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
