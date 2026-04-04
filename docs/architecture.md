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
6. API records updates and events
7. UI reflects state

## Key Design Choices

### Repo vs Kanban

- Repo contains final truth
- Kanban contains process

### Markdown Roundtrip

- Card description is edited as markdown
- CLI supports fetch and update of markdown

### Event Log

- All changes recorded

### No Workflow Engine

- No complex orchestration
- Agents pull work

## Non-goals

- No scheduling engine
- No distributed workflow system
- No tight coupling with GitHub PR model

## Future Extensions (not in MVP)

- context slicing for agents
- DoD validation
- summary generation automation
- Git integration enhancements
