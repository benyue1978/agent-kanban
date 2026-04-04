# Markdown and Update Model

## Overview

Card description is stored as markdown and remains the primary editable content.

However, V1 must support both:

- full markdown roundtrip editing
- safe, structured partial updates

This document defines how both coexist.

## Core Problem

If only full markdown replacement is supported:

- human and agent edits can overwrite each other
- Final Summary can be lost
- concurrent work becomes unsafe

## Revision Model

Each card should include a revision indicator.

Possible implementation:

- `updated_at` timestamp
- or explicit `revision` number

### Rule

When updating full markdown:

- client must provide the last known revision
- backend rejects update if revision has changed

This is optimistic locking.

## Update Modes

### 1. Full Markdown Roundtrip

`kanban show --id 123 > card.md`
edit the file locally
`kanban update-card --id 123 --file card.md --revision <known_revision>`

Use when:

- editing planning sections
- updating large portions of the card

### 2. Structured Partial Updates

These commands update specific parts of the card safely.

#### set-state

`kanban set-state --id 123 --to "In Progress"`

#### assign-owner

`kanban assign-owner --id 123 --to agent-coder`

#### append-summary

`kanban append-summary --id 123 --file summary.md`

#### add-comment

`kanban comment --id 123 --body "..." --kind progress`

## Section Contract

V1 should not attempt to support arbitrary markdown structure for protected card sections.

The section contract is intentionally limited.

### Allowed flexibility

- card title can vary
- free text inside sections is allowed
- additional non-protected sections may exist

### Protected section headings

The backend and agents should treat the following headings as stable anchors:

- `## Goal`
- `## Context`
- `## Scope`
- `## Definition of Done`
- `## Constraints`
- `## Plan`
- `## Final Summary`

Within `## Final Summary`, the following subheadings should also be treated as stable when present:

- `### What was done`
- `### Key Decisions`
- `### Result / Links`
- `### DoD Check`

Agents should not rename protected headings.

Protected headings are how the backend finds and protects important sections.

## Summary Protection

Final Summary should be treated as a protected section.

Rules:

- append or update through explicit commands for agent workflows
- avoid accidental overwrite by full markdown update
- backend should reject full update attempts that corrupt or remove protected summary structure unexpectedly

## Suggested Backend Behavior

The backend should not try to become a general markdown merge engine.

V1 should do the following instead:

- recognize protected headings by stable heading anchors
- apply optimistic locking to full updates
- prefer structured commands for critical sections
- reject unsafe writes rather than attempting clever automatic merges

## Recommended Strategy

- allow full markdown updates with revision check
- introduce structured commands for critical fields
- prefer structured commands in agent workflows

## Why this matters

This keeps:

- markdown flexible for humans and agents
- system safe under concurrent updates
- Final Summary reliable

## Non-goals

- no CRDT or real-time collaborative editing in V1
- no complex diff/merge engine
- no attempt to parse arbitrary markdown into a rich document model

Keep the model simple but safe.
