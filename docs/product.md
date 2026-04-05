# Product Definition

## Overview

agent-kanban is an AI-native Kanban system for software development where collaborators can be humans or agents.

It is designed to support a workflow where:

- humans and agents collaborate on tasks
- tasks are represented as cards
- cards provide enough context for execution
- code and final artifacts live in a Git repository
- the Kanban system visualizes and records the process

## Core Concepts

### Project (Kanban)

- one project corresponds to one Kanban board
- a project is bound to a logical Git repository
- the repository manages code and documents
- the Kanban manages tasks and collaboration

### Card

- a card represents a feature or task
- a card contains:

  * title
  * description (markdown)
  * state
  * owner
  * priority

A card is the primary execution unit for both humans and agents.

A card is not just a task label. It is the execution harness for a unit of work.

### Collaborator

A collaborator can be:

- human
- agent

There are no additional first-class actor types in V1.

Things like review are modeled as evidence on the card timeline and completion rules, not as separate domain roles.

### Personal Inbox

Each collaborator has an inbox view driven by @mentions in comments.

Inbox is for communication, not task execution.

## States

Cards move through states:

New → Ready → In Progress → Done

## Collaboration Model

- humans and agents discuss and create cards
- cards are refined in New state
- cards move to Ready when sufficiently defined
- humans or agents move cards to In Progress to execute
- review evidence is captured through comments and verification
- Done requires a final summary plus verification evidence

## Product Philosophy

### 1. Layered source of truth

The system separates different kinds of truth:

- the repo is authoritative for code, tests, design docs, and artifacts
- the Kanban system is authoritative for task state, ownership, comments, and process history
- before MVP exists, planning may live in repo markdown docs
- after bootstrapping, active task planning should move into the Kanban system

### 2. Card as execution harness

A card provides enough context for an agent or human to work on a task without treating the Kanban as the place where implementation truth lives.

The repo remains the implementation truth.

The card remains the execution and coordination truth for that task.

### 3. Process visibility over orchestration

The system is not intended to be a workflow engine or autonomous orchestrator.

Instead, it is meant to be:

- a process layer
- a visibility layer
- a controlled execution harness for agents

### 4. Human via UI, agent via CLI

Humans primarily interact through a web UI.

Agents primarily interact through CLI and API.

The product should support these two access styles naturally rather than forcing both into the same interface.

### 5. Logical repo identity over local path identity

The product should think in terms of logical repository identity at the project level.

Local clone path, current working directory, and worktree are runtime execution context, not the core identity of a project.

## Key Differentiator

Cards act as execution harnesses, not just task trackers.

They provide structured context for agents to reliably perform work.

That means a card should help answer:

- what needs to be done
- why it matters
- what counts as done
- what constraints apply
- how the result should later be summarized

## Bootstrapping Model

The product is designed to become able to manage its own future development.

That means:

1. initial planning can begin in repo markdown docs before the system exists
2. the MVP is built
3. those draft planning cards are backfilled into the running system
4. future planning and execution then move into the system itself

## V1 Product Shape

V1 intentionally keeps the model small.

### Included

- project boards
- cards
- comments
- inbox via mentions
- single owner model
- markdown-based card content
- soft review recorded through comments, summary, and verification evidence
- event history
- CLI for agents
- web UI for humans

### Not included

- multi-owner cards
- blocked state
- workflow engine
- complex approval object model
- real-time collaborative markdown editing

## Design Goal

The goal is to keep the system simple in model shape but strict in execution rules.

It should feel close to a strong project board for humans, while giving agents a stable and reliable way to:

- read context
- perform work
- update state
- leave understandable history
