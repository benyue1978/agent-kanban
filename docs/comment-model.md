# Comment Model

## Purpose

Comments in V1 are intentionally lightweight, but they still need minimal structure so that:

- humans can follow progress
- agents can filter signal from noise
- inbox remains usable

## Comment Semantics

A comment is still a timeline entry attached to a card, but it should include a lightweight semantic kind.

### Comment kinds

- `progress` — work completed, findings, status update
- `question` — asks for input or clarification
- `decision` — records a decision or conclusion
- `note` — general note or contextual message

V1 does not require a complex message schema beyond this.

## Required Fields

- id
- card_id
- author_id
- body
- kind
- mentions
- created_at

## Mentions

Comments can mention collaborators using `@name` or equivalent collaborator reference.

Mentions are used to drive inbox.

## Inbox Model

Inbox is a view over mention-targeted comments.

Inbox is not a task queue and does not automatically block a card.

### Inbox item semantics

Each mention-driven inbox item should have a lightweight handling status.

Suggested statuses:

- `open`
- `acknowledged`
- `resolved`

These statuses can be implemented as a view-level or derived mechanism in V1 rather than a fully separate workflow object.

## Why this matters

Without kind metadata:

- agents cannot reliably separate progress from questions
- inbox becomes a noisy stream of undifferentiated comments
- human review becomes harder as card volume grows

## V1 Constraints

- no nested threaded discussion is required
- no separate approval object is required
- comment remains the primary lightweight communication unit

## Recommended Usage

### progress

Use for:

- tests added
- implementation completed
- repo artifact created

### question

Use for:

- asking human to decide
- asking for missing requirements
- asking reviewer for clarification

### decision

Use for:

- recording design choices
- stating review outcome
- capturing final direction

### note

Use for:

- minor context
- handoff text
- low-importance messages
