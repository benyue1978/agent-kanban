# Domain Model

## Overview

The system manages multiple projects. Each project has one Kanban board and is bound to one Git repository.

The main domain entities are:

- Project
- Card
- Collaborator
- Comment
- Event
- Inbox view

## Project

A project is one Kanban.

### Properties

- id
- name
- description
- repo_url
- config

### Rules

- One project is bound to one logical repository
- V1 assumes one primary repo per project
- `repo_url` is the project-level repository identity
- local `repo_path` is runtime-local execution context, not project identity

## Card

A card is a feature or task.

### Properties

- id
- project_id
- title
- description_md
- state
- owner_id
- priority
- created_at
- updated_at
- archived_at

### Meaning

A card is the execution harness for a unit of work.

It should provide enough context for a collaborator, especially an agent, to carry out the task, with the repo providing code and artifacts.

## Card States

- New
- Ready
- In Progress
- Done

### State semantics

- **New**: idea, rough requirement, or task under discussion
- **Ready**: sufficiently defined for implementation or research execution
- **In Progress**: someone is actively working on it
- **Done**: work is completed, summarized, and backed by verification evidence

### State rules

- In Progress should have an owner
- Before Done, card must contain a final summary
- Before Done, card must have verification evidence

## Collaborator

There are only two collaborator types in V1:

- human
- agent

The system does not introduce additional first-class actor roles such as reviewer. Review is modeled as evidence on the card timeline plus completion rules.

### Properties

- id
- type
- name
- optional capabilities metadata

## Comment

Comments belong to a card.

### Properties

- id
- card_id
- author_id
- body
- kind
- mentions
- created_at

### Semantics

Comments are timeline entries with lightweight semantic types.

They support:

- progress logging
- lightweight coordination
- mention-driven inbox
- decision recording

V1 does not require threaded nested comments.

## Event Log

All important actions should be recorded as events.

### Must-log event types

The following actions must always result in event records:

- `card_created`
- `owner_assigned`
- `state_changed`
- `markdown_updated`
- `summary_updated`
- `comment_added`
- `card_archived`

If reopen is supported:

- `card_reopened`

### Purpose

- auditability
- timeline reconstruction
- process visibility

### Event granularity

V1 event log is for audit and timeline purposes, not full event-sourced state reconstruction.

For markdown-related actions, record:

- operation type
- actor
- card id
- revision before / after when relevant

Do not require full markdown diff storage in V1.

## Inbox

Inbox is not a separate task system in V1.

It is a view of comments that mention a collaborator.

### Semantics

- inbox supports communication
- inbox does not execute work
- inbox does not block cards

## Ownership Model

V1 uses a single owner model.

A card has one owner at a time. There is no multi-owner support.

Although agent execution may internally involve subagents, this is not represented in the Kanban domain model.

## Artifacts

Artifacts are first-class in the workflow, but in V1 they primarily live in the repository rather than in the Kanban database.

Cards may refer to design docs, implementation docs, or other markdown artifacts stored in the repo.

## Summary Model

A card has two logical content layers:

1. Planning and working description
2. Final Summary

The planning sections may drift during implementation. The Final Summary is the trusted concise record that must exist before the card is moved to Done.
