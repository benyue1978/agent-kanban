# agent-kanban

AI-native Kanban for human + agent collaboration.

## What it is

agent-kanban is a software development Kanban system designed for teams where collaborators can be humans or AI agents.

It is built for a workflow where:

- code and artifacts live in a Git repository
- task process and progress live in a Kanban system
- cards act as execution harnesses for work
- agents primarily use CLI
- humans primarily use a web UI

This is not a workflow engine and not an autonomous orchestrator. It is a Kanban tool that is AI-native.

## Core idea

The system separates three things that are often mixed together:

- **implementation truth** lives in the repo
- **process truth** lives in the Kanban system
- **execution context** lives in the card

That means:

- repo answers: what was built
- kanban answers: what is happening
- card answers: what this unit of work needs in order to be executed

## Actor model

There are only two actor types in V1:

- human
- agent

The system does not introduce additional first-class actor roles such as reviewer. Review is modeled as an allowed action under workflow and project policy.

## Project model

One Kanban equals one project.

A project is bound to a logical repository identity, represented by `repo_url`.

At runtime, work usually happens from a local clone or worktree, using:

- `repo_url` = logical repository identity
- local cwd / repo context = local execution context
- `kanban_url` = Kanban system endpoint

## Workflow shape

Cards move through a lightweight but enforced lifecycle:

New → Ready → In Progress → In Review → Done

The system is intentionally small in model shape, but strict in execution rules.

V1 does not include:

- multi-owner cards
- blocked state
- workflow engine
- complex approval object model
- real-time collaborative markdown editing

## Card model

A card is the core execution unit of the system.

A card is not just a task label. It is an execution harness that helps a human or agent understand:

- what needs to be done
- what context matters
- what counts as done
- what constraints apply
- how the result should later be summarized

## Bootstrapping goal

The MVP is not only to make the system usable.

The real bar is that once the system is running, earlier planning work can be backfilled into real cards, and future work can then be planned and executed through the system itself.

In other words:

1. repo-first planning comes first
2. MVP is implemented
3. draft cards are backfilled into the system
4. future work moves into the running Kanban system

## Documentation map

The repo docs are the normative source for system rules.

- `docs/product.md` — product scope, concepts, and user model
- `docs/domain-model.md` — entities, relationships, and lifecycle
- `docs/architecture.md` — architecture, runtime vs domain, and enforcement responsibilities
- `docs/card-spec.md` — canonical card template and summary rules
- `docs/workflow.md` — state transitions, claim behavior, and workflow validation
- `docs/project-policy.md` — minimal project-level policy surface
- `docs/comment-model.md` — comment kinds, inbox semantics, and summary boundary
- `docs/markdown-model.md` — markdown update rules, revision checks, and structured update model
- `docs/source-of-truth.md` — layered source-of-truth model
- `docs/bootstrapping.md` — repo-first planning, backfill, and self-management
- `docs/cli.md` — CLI and command contract
- `docs/web-ui.md` — human-facing UI requirements
- `docs/mvp.md` — MVP definition and bootstrapping criteria
- `skills/SKILL.md` — agent operational skill derived from the repo docs

## Design direction

The design goal is to stay:

- simple in model shape
- explicit in system contracts
- strict in backend enforcement
- practical for human + agent collaboration

The system should feel closer to a strong project board for humans, while giving agents a stable and reliable way to:

- read context
- perform work
- update state
- handle conflicts
- leave behind understandable history

## Tech choices

- Backend: Node.js
- CLI: Node.js
- Frontend: Next.js
- Database: PostgreSQL
