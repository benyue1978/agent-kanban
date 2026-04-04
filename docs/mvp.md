# MVP Definition

## Overview

The MVP goal is not just to make the system usable.

The key requirement is that the system can be used to manage its own development (bootstrapping).

## MVP Scope

The MVP must include:

- backend API
- CLI for agent interaction
- web UI for human interaction
- markdown-based card editing
- comment system
- state machine

## Functional Requirements

### Project

- create project
- bind repo

### Card

- create card
- update markdown
- assign owner
- update state
- archive card

### Comment

- add comment
- support @mention

### Event log

- record all operations

### CLI

- list cards
- show card
- update card
- comment
- update state

### Web UI

- board view
- card detail
- comments
- inbox

## Required Workflow

The system must support a full card lifecycle:

New → Ready → In Progress → In Review → Done

## Final Summary Requirement

Before moving a card to Done:

- Final Summary must be filled

## Bootstrapping Requirement

The system must be able to:

1. Backfill past work into cards
2. Plan new work using cards
3. Execute work using agents through CLI
4. Record progress and comments
5. Review and finalize work

## Bootstrapping DoD

The system is considered successful when:

- the system is used to manage its own development
- at least 5 cards are completed using the system
- agents are actively used in the workflow

## Non-goals

- no multi-agent ownership
- no blocked state
- no workflow engine

## Success Criteria

- agents can reliably read and act on cards
- humans can understand project progress through UI
- repo and Kanban stay consistent in intent

## Future Improvements (Not MVP)

- recommended next task
- deeper Git integration
- structured validation of DoD
- context slicing for agent input
