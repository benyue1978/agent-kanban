# Architecture

## Overview

The system is composed of three main parts:

- Backend API (Node.js)
- CLI (Node.js)
- Web UI (Next.js)

## High-Level Architecture

Backend provides:

- REST API
- database access
- business rules

CLI provides:

- agent interface
- command-based interaction with API

Web UI provides:

- board visualization
- card detail view
- comments and inbox

## Components

### Backend

Responsibilities:

- manage cards
- manage comments
- manage state transitions
- record events
- enforce workflow validation
- enforce revision checks for markdown updates

Tech:

- Node.js
- PostgreSQL
- ORM (e.g., Prisma)

### CLI

Responsibilities:

- list tasks
- fetch card details
- update markdown
- update state
- assign owner
- append summary
- add comments

CLI should interact via HTTP API.

### Web UI

Responsibilities:

- display Kanban board
- display card detail
- show comment timeline
- provide inbox

UI is read-heavy, with limited write actions for humans.

## Data Flow

1. Agent requests tasks via CLI
2. CLI calls API
3. API returns card data
4. Agent executes work in repo
5. Agent updates card via CLI
6. API validates updates, records events, and persists state
7. UI reflects state

## Key Design Choices

### Source-of-truth separation

- repo is authoritative for code and artifacts
- kanban is authoritative for task process and progress
- pre-MVP planning may live in repo docs, but active planning should move into the system after bootstrapping

### Markdown plus structured commands

- Card description is edited as markdown
- CLI supports fetch and full update of markdown
- CLI also supports structured updates for critical operations such as state, ownership, summary, and comments

### Concurrency safety

- full markdown updates require optimistic locking through revision or timestamp checks
- backend should reject unsafe overwrites instead of trying to do complex merges in V1

### Event Log

- all important changes are recorded
- event log is for audit and timeline, not full event-sourced reconstruction in V1

### No Workflow Engine

- no complex orchestration
- agents pull work
- backend still enforces transition rules and policy checks

## Non-goals

- no scheduling engine
- no distributed workflow system
- no tight coupling with GitHub PR model
- no real-time collaborative markdown editing

## Future Extensions (not in MVP)

- context slicing for agents
- DoD validation
- summary generation automation
- Git integration enhancements
- richer execution runtime bindings beyond local `repo_path`
