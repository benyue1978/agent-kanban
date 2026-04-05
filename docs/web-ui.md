# Web UI

## Overview

The web UI is the primary interface for humans.

It should be visually clear, pleasant to use, and optimized for understanding project and task state.

The UI is not required to expose every agent-oriented write action. Some write actions are intentionally CLI-only.

## UI Principles

- clear board visualization
- easy card inspection
- easy progress understanding
- limited but important human write actions
- good visual design

## Primary Screens

### 1. Project List

Shows all projects.

Each project should display:

- name
- description
- repo binding
- summary counts by state

### 2. Kanban Board

Displays cards by state columns:

- New
- Ready
- In Progress
- Done

Card preview should show at least:

- card id
- title
- owner
- priority

Cards should be sortable and visually easy to scan.

### 3. Card Detail

This is the most important screen.

It should show:

- title
- state
- owner
- priority
- markdown description
- Final Summary section when present
- comments timeline
- related repo document links if available

### 4. Inbox

Shows comments that mention the current human collaborator.

This is a communication-focused view, not a task execution queue.

## Human Write Actions

V1 web UI should support selected human write actions.

### Required write actions

- add comment
- write @mentions
- update priority

### Optional later actions

- update card markdown
- update owner
- update state

The system can intentionally keep some writes CLI-only.

## Agent-Oriented Features Not Required in UI

The following do not need first-class UI writing support in V1:

- raw markdown roundtrip editing optimized for agents
- advanced batch updates
- agent-specific task pulling commands

## UX Notes

### Readability

Card detail should be easy to read for long markdown.

### Visual quality

The interface should feel modern and polished, closer to a strong product UI than a rough admin panel.

### Timeline clarity

Comments and changes should be easy to follow in chronological order.

### Context copy

Useful future idea:

- a button to copy card context for direct use with Codex or other tools

## V1 Goal

The web UI should make it easy for a human to:

- understand project progress
- inspect what agents are doing
- leave comments
- adjust priority
- add verification evidence and complete work when it is ready
