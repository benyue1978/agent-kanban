# Bootstrapping

## What bootstrapping means in this project

Bootstrapping does **not** mean the system already exists and is immediately managing itself.

At the beginning, only the repository exists. The repository contains product docs, architecture docs, the agent skill, and planning documents.

Bootstrapping means that after the MVP is implemented and running, the system becomes usable enough to:

1. backfill earlier planned work into real cards
2. use those cards to manage remaining development
3. continue planning and execution inside the system itself

In other words, the repository comes first, and the running Kanban system comes second. Once the system is working, it should be able to take over management of its own future work.

## Phase model

### Phase 0: Repo-first planning

At this stage:

- there is no working Kanban system yet
- all requirements live in markdown documents in the repo
- initial cards exist only as draft planning content

The repo is the only source of project definition.

### Phase 1: MVP implementation

The first goal is to make the minimum system usable.

That means implementing at least:

- backend API
- database model
- CLI for agent usage
- web UI for humans
- card lifecycle
- comments and inbox

At the end of this phase, the system can run locally and basic workflows are possible.

### Phase 2: Backfill

Once the MVP is running, an agent can read draft card definitions from the repo and create them in the actual system.

This includes:

- creating cards from markdown planning docs
- filling title, goal, DoD, and summary where applicable
- setting state appropriately

This is the first true bootstrapping step.

### Phase 3: Self-management

After backfill, new work should be planned and executed in the system itself.

From this point on:

- future features are added as cards in the system
- agents use CLI to read and update cards
- humans use the web UI to review and guide progress

The repo still remains the source of truth for code and artifacts, but the Kanban system becomes the source of truth for task process and planning.

## Post-Backfill Document Policy

After draft cards have been backfilled into the running system:

- bootstrap planning files in the repo should no longer be treated as the active task tracker
- those files may remain as seed history or reference material
- active task planning, task state, and task progression should happen in the Kanban system
- if bootstrap card drafts are retained, they should be clearly marked as historical or backfilled

## Important distinction

### Before MVP exists

There are no real system cards yet.

Only draft card definitions exist in markdown files inside the repo.

### After MVP exists

The system contains real cards.

Those cards can be created by backfilling draft definitions from the repo.

## Bootstrapping success criteria

Bootstrapping is successful when all of the following are true:

- the system runs locally
- agents can interact with it through CLI
- humans can inspect and review it through the web UI
- initial draft cards have been backfilled into the system
- new work is planned through the system itself
- at least one repo seed card has been converted into a real system card through agent action
- at least one card has completed a full lifecycle through the running system

## Practical workflow

1. Define requirements in repo markdown
2. Build MVP
3. Start the system
4. Use an agent with `skills/SKILL.md` to create real cards from draft planning docs
5. Continue all future task planning and execution through the running system

## Why this matters

This keeps the project realistic.

It avoids pretending the system already exists before it is implemented, while still designing the project so it can eventually manage itself.
