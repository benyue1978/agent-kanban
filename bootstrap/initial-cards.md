# Initial Cards for MVP Backfill

> Historical note: Backfilled into the running system on 2026-04-05. This file remains historical seed input only.

These are draft cards that will be created in the system once the MVP is running.

## Card 1: Backend Skeleton

### Goal
Create the initial Node.js backend with project and card API skeleton.

### Definition of Done
- API server runs locally
- database connection works
- basic project model exists
- basic card model exists

## Card 2: CLI v0

### Goal
Create the first CLI for agent interaction.

### Definition of Done
- can list cards
- can show card
- can create card
- can update state

## Card 3: Markdown Roundtrip

### Goal
Support reading a card as markdown, editing it, and writing it back.

### Definition of Done
- can export card markdown
- can edit markdown locally
- can write updated markdown back
- formatting is preserved

## Card 4: State Machine

### Goal
Implement the lifecycle:
New → Ready → In Progress → In Review → Done

### Definition of Done
- transition rules exist
- events are recorded
- Done requires Final Summary

## Card 5: Web UI Board

### Goal
Build the Kanban board UI in Next.js.

### Definition of Done
- board shows columns by state
- cards are visible in each column
- project can be viewed in browser

## Card 6: Card Detail UI

### Goal
Build the card detail page.

### Definition of Done
- card markdown is rendered
- state / owner / priority are shown
- Final Summary is visible

## Card 7: Comments and Inbox

### Goal
Support comments, @mentions, and inbox view.

### Definition of Done
- comments can be added
- mentions are parsed
- inbox shows mentions
