# Local-First MVP Vertical Slice Design

## Purpose

Define the first implementation slice for `agent-kanban` so the project can move from repo-only planning into a running local system with a usable end-to-end workflow.

This spec is for a local-first, single-project MVP that supports:

- one backend API
- one CLI for agent work
- one web UI for human visibility and focused card actions
- named local human and agent identities
- a complete card lifecycle from `New` to `Done`

The design is intentionally optimized for a vertical slice that proves the full loop instead of maximizing feature breadth.

## Scope

This slice must support one realistic end-to-end workflow:

1. a human creates or refines a card until it is `Ready`
2. an agent claims the card through the CLI
3. the agent executes work in the repo and updates the card through the API
4. verification evidence is recorded on the card timeline
5. a human or owner completes the card from `In Progress` to `Done`

### In scope

- local-first deployment
- one project board bound to one logical `repo_url`
- cards, comments, mentions, inbox items, and event history
- markdown-backed card content with protected headings
- workflow enforcement and project policy enforcement in the backend
- CLI commands for agent-heavy write operations
- web UI for board, card detail, inbox, and focused human writes
- bootstrap import of seed cards after the system is running

### Out of scope

- multi-tenant SaaS concerns
- multi-owner cards
- blocked state
- real-time collaborative editing
- generalized markdown merge
- GitHub or PR-specific workflow modeling
- autonomous orchestration or scheduling

## Product Positioning For This Slice

The MVP is a local-first Kanban tool for human and agent collaboration, not a workflow engine.

The system preserves layered truth:

- repo = implementation truth
- Kanban = task process truth
- card = execution harness for the unit of work

This slice should make that separation executable, not just documented.

## Architecture

The implementation should use a modular monolith with three runtime surfaces and shared internal packages.

### Runtime surfaces

- `apps/api`
  - backend authority for workflow, policy, revision checks, and persistence
- `apps/cli`
  - command-oriented agent interface that talks only to the API
- `apps/web`
  - Next.js human interface for board visibility, card inspection, inbox, and review actions

### Shared packages

- `packages/domain`
  - state machine
  - policy evaluation
  - workflow validation
  - stable error definitions
- `packages/contracts`
  - request and response shapes
  - shared enums and payload types
  - actor identity model
- `packages/card-markdown`
  - protected heading parsing
  - summary validation
  - section-aware markdown helpers

### Persistence

- PostgreSQL is the only database
- repo artifacts stay in Git and are referenced from cards or summaries

### Authority model

- backend is the only place allowed to approve transitions, claims, and revision-sensitive updates
- CLI and web UI can share internal types, but neither may bypass backend workflow rules

## Repository Layout

The repo should be organized as a monorepo even though the runtime stays local-first.

Recommended top-level structure:

```text
apps/
  api/
  cli/
  web/
packages/
  contracts/
  domain/
  card-markdown/
docs/
  superpowers/
    specs/
```

This layout is intended to keep ownership boundaries visible while still allowing fast local development.

## Identity Model

The MVP should use named local actors with lightweight project-scoped identity.

### Actor types

- `human`
- `agent`

### Collaborator model

Each collaborator should have:

- `id`
- `project_id`
- `actor_type`
- `handle`
- `display_name`
- `auth_token_hash`
- `active`

Examples:

- `human:song`
- `agent:codex-main`

### Identity behavior

- the CLI authenticates with a project-local bearer token stored in local config or environment variables
- the web UI authenticates as a named human actor through a lightweight local session backed by the same collaborator identity table
- the system records actor identity on comments, transitions, assignments, and events

This gives reliable ownership and audit behavior without pulling in hosted-account complexity.

## Domain And Persistence Model

The model should stay small, but the persisted structure must be explicit enough to make workflow deterministic.

### `projects`

Fields:

- `id`
- `name`
- `description`
- `repo_url`
- `policy_json`
- `created_at`

Purpose:

- logical repository identity
- project-level workflow policy

### `cards`

Fields:

- `id`
- `project_id`
- `title`
- `description_md`
- `revision`
- `state`
- `owner_id`
- `priority`
- `archived_at`
- `created_at`
- `updated_at`

Purpose:

- primary execution unit
- metadata needed for board queries and workflow checks
- markdown body for planning and final summary content

### `comments`

Fields:

- `id`
- `card_id`
- `author_id`
- `kind`
- `body_md`
- `created_at`

Kinds:

- `progress`
- `question`
- `decision`
- `note`

### `comment_mentions`

Fields:

- `comment_id`
- `mentioned_collaborator_id`
- `status`
- `created_at`
- `updated_at`

Statuses:

- `open`
- `acknowledged`
- `resolved`

Purpose:

- explicit inbox items
- stable acknowledgement flow

Inbox state should not be derived only at read time because humans need a durable status for handling mentions.

### `events`

Fields:

- `id`
- `project_id`
- `card_id`
- `actor_id`
- `type`
- `payload_json`
- `created_at`

Must-log event types:

- `card_created`
- `owner_assigned`
- `state_changed`
- `markdown_updated`
- `summary_updated`
- `comment_added`
- `card_archived`

Purpose:

- auditability
- process debugging
- timeline reconstruction without event sourcing

## Card Content Model

Card content remains markdown-first.

### Protected headings

The following headings are stable anchors:

- `## Goal`
- `## Context`
- `## Scope`
- `## Definition of Done`
- `## Constraints`
- `## Plan`
- `## Final Summary`

Inside `## Final Summary`, these subheadings are also protected:

- `### What was done`
- `### Key Decisions`
- `### Result / Links`
- `### DoD Check`

### Column vs markdown split

Persist as columns:

- title
- state
- owner
- priority
- revision
- timestamps
- archive status

Persist only in markdown:

- Goal
- Context
- Scope
- Definition of Done
- Constraints
- Plan
- Final Summary
- DoD Check content

V1 should not duplicate Final Summary sections into separate columns. Validation should parse protected markdown sections instead.

## Workflow And Policy Model

Cards move through:

- `New`
- `Ready`
- `In Progress`
- `Done`

### Transition rules

#### `New -> Ready`

Requires:

- title exists
- Goal exists
- Definition of Done exists
- Scope section exists and is not empty

Triggered by:

- human
- agent only under explicit human instruction

#### `Ready -> In Progress`

Requires:

- owner must be set by the end of the operation
- card must still be eligible at the time of claim

Triggered by:

- human
- assigned owner
- agent acting under explicit human instruction
- agent picking an unassigned Ready card only if project policy allows it

Behavior:

- assignment and transition happen atomically

#### `In Progress -> Done`

Requires:

- owner exists
- Final Summary exists
- verification evidence exists on the card timeline

Triggered by:

- current owner
- supervising human

### Project policy fields

The project policy should stay small:

- `allow_agent_pick_unassigned_ready`
- `default_selection_policy`
- `allowed_transition_actors`

Recommended defaults:

- `allow_agent_pick_unassigned_ready = false`
- `default_selection_policy = priority_then_ready_age_then_updated_at`

## API Design

The backend API should be command-oriented rather than attempting to expose a generic mutable resource model for everything.

### Endpoints required in this slice

- `POST /projects`
- `GET /projects/:id/board`
- `GET /cards/:id`
- `POST /cards`
- `POST /cards/:id/assign-owner`
- `POST /cards/:id/set-state`
- `POST /cards/:id/update-markdown`
- `POST /cards/:id/append-summary`
- `POST /cards/:id/comments`
- `GET /inbox`
- `POST /inbox/items/:id/set-status`

### API behavior principles

- card detail responses include markdown, revision, owner, state, summary presence, and recent comments
- board responses are optimized for state-column rendering
- write endpoints always return stable machine-usable payloads
- backend performs validation before persisting mutations

### Stable error codes

The API must return stable error codes:

- `invalid_transition`
- `missing_owner`
- `missing_required_section`
- `summary_required`
- `forbidden_action`
- `revision_conflict`
- `claim_conflict`

The CLI and web UI should surface these codes directly instead of inventing separate local semantics.

## Concurrency Model

Two concurrency risks matter in this slice.

### Markdown update conflicts

- full markdown writes require the caller to send the last known `revision`
- stale writes fail with `revision_conflict`
- backend rejects unsafe writes instead of merging them

### Claim conflicts

Taking a card from `Ready` to `In Progress` is a claim action.

The backend must perform the following in one transaction:

1. verify the card is still `Ready`
2. verify the action is allowed by policy
3. set owner if needed
4. move the state to `In Progress`
5. write the relevant events

If another actor won the race, return `claim_conflict`.

## CLI Design

The CLI is the primary write-heavy interface for agents.

### Required commands

- `kanban list`
- `kanban show --id <card_id>`
- `kanban create --title "..."`
- `kanban assign-owner --id <card_id> --to <actor>`
- `kanban set-state --id <card_id> --to "<state>"`
- `kanban update-card --id <card_id> --file <path> --revision <revision>`
- `kanban append-summary --id <card_id> --file <path>`
- `kanban comment --id <card_id> --body "..." --kind <kind>`

### CLI behavior

- CLI talks only to the backend API
- CLI prefers structured commands for ownership, state, summary, and comments
- full markdown roundtrip is used for planning-section edits and larger content changes
- CLI outputs plain text or JSON, but machine-usable error codes must be recoverable

## Web UI Design

The web UI is a read-heavy human interface with review-oriented writes.

### Required screens

- project board
- card detail
- inbox

### Required read behavior

#### Board

Shows:

- cards grouped by state
- card id
- title
- owner
- priority

#### Card detail

Shows:

- title
- state
- owner
- priority
- rendered markdown
- Final Summary when present
- comment timeline
- artifact or repo links

#### Inbox

Shows:

- comments mentioning the current human collaborator
- inbox item status

### Required human write actions

- add comment
- write `@mentions`
- update priority
- move `New -> Ready`
- move `Ready -> In Progress`
- move `In Progress -> Done`

### Explicitly deferred web writes

- full markdown editing
- full owner management
- agent-oriented task pulling

This keeps the browser aligned with the approved review-oriented human role in the first slice.

## Event And Comment Behavior

Comments are timeline entries, not the final result record.

### Comment usage

- `progress` for execution updates
- `question` for clarification requests
- `decision` for important choices or review outcomes
- `note` for lower-importance context

If a decision affects the final understanding of the work, it must also appear in Final Summary before completion.

### Mention handling

When a comment contains `@mention` references:

1. the system resolves mentioned collaborators
2. it creates `comment_mentions` rows
3. new inbox items start as `open`

## Bootstrap And Backfill

Bootstrapping happens after the local system is running.

### Required bootstrap behavior

- import seed cards from `bootstrap/initial-cards.md` into the running system
- preserve the repo file as historical seed input, not as active task state
- record where imported cards came from, either in event payload or card context

### Post-backfill rule

After import:

- new planning should happen in the system
- repo seed docs remain reference material only
- retained seed docs should be marked historical or backfilled before bootstrap is considered complete

## Implementation Order

The build should proceed in this order:

1. create monorepo package and app skeleton
2. implement shared contracts, workflow rules, markdown protection, and error types
3. implement database schema and repositories
4. implement API endpoints against the real persistence layer
5. implement CLI against the real API
6. implement web board, card detail, inbox, and review actions
7. implement seed-card backfill tooling

This order keeps the vertical slice grounded in the shared rules and prevents the web UI or CLI from inventing behavior first.

## Testing Strategy

The first slice should be validated at four levels.

### Unit tests

For:

- workflow transitions
- project policy evaluation
- markdown protected-heading parsing
- summary validation
- mention parsing

### Integration tests

For:

- claim conflict behavior
- revision conflict behavior
- event logging
- inbox item creation and status updates
- API endpoint contracts

### CLI integration tests

For:

- list and show behavior
- structured write commands
- machine-usable conflict and validation failures

### Web smoke tests

For:

- board rendering
- card detail rendering
- comment creation
- inbox visibility
- human verification and completion actions

## Acceptance Criteria

The vertical slice is complete when all of the following are true:

- one project can be created and bound to a logical `repo_url`
- a card can be created and refined to `Ready`
- an agent can claim the card through the CLI
- the agent can update markdown with revision safety
- the agent can add progress and verification comments while working the card
- a human can inspect the card in the browser
- a human can complete the card from `In Progress` when summary and verification are present
- `Done` is rejected without Final Summary and verification evidence
- event history reflects the major workflow operations
- mentions create inbox items with durable status
- at least one bootstrap seed card can be imported into the running system

## Design Constraints

The implementation must preserve these constraints:

- backend remains the only workflow authority
- UI and CLI do not duplicate workflow rules
- markdown remains flexible, but protected sections stay stable
- local-first simplicity is preferred over SaaS-ready abstraction
- features not needed for the first end-to-end loop should stay out

## Result

If implemented as specified, this slice will provide a usable local-first Kanban system that can:

- coordinate humans and agents around cards
- safely manage workflow and conflicts
- preserve repo truth versus process truth
- transition from repo bootstrap planning into system-managed future work

That is enough to move into implementation planning without another design pass.
