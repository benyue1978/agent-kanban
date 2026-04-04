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

```
kanban show --id 123 > card.md
# edit
kanban update-card --id 123 --file card.md
```

Use when:

- editing planning sections
- updating large portions of the card

### 2. Structured Partial Updates

These commands update specific parts of the card safely.

#### set-state

```
kanban set-state --id 123 --to "In Progress"
```

#### assign-owner

```
kanban assign-owner --id 123 --to agent-coder
```

#### append-summary

```
kanban append-summary --id 123 --file summary.md
```

#### add-comment

```
kanban comment --id 123 --body "..." --kind progress
```

## Summary Protection

Final Summary should be treated as a protected section.

Rules:

- append or update through explicit commands
- avoid accidental overwrite by full markdown update

## Suggested Backend Behavior

- parse markdown into logical sections
- protect Final Summary unless explicitly modified
- merge changes where possible

V1 can implement this minimally, but the direction should be clear.

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

Keep the model simple but safe.
