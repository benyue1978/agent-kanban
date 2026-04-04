# MVP Definition

## Overview

The MVP goal is not just to make the system usable.

The key requirement is that the system can be used to manage its own development in a realistic way after bootstrapping.

That means the MVP must support:

- repo-first planning before the system exists
- a running Kanban system with enforced workflow
- backfilling earlier draft work into real cards
- future planning and execution inside the system itself

## MVP Scope

The MVP must include:

- backend API
- CLI for agent interaction
- web UI for human interaction
- markdown-based card editing
- structured partial card updates
- comment system
- state machine
- project policy support
- event history

## Functional Requirements

### Project

- create project
- bind project to `repo_url`
- support project policy
- support connection to a `kanban_url` runtime endpoint

### Card

- create card
- update markdown with revision checking
- assign owner
- update state
- archive card

### Comment

- add comment
- support `@mention`
- support comment kinds

### Event log

- record must-log operations

### CLI

- list cards
- show card
- update card
- set state
- assign owner
- append summary
- comment

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
- DoD Check must be filled or explicitly addressed

## Claim and Concurrency Requirements

The system must safely handle:

### Claim conflicts

When two actors try to claim the same Ready card:

- backend must atomically validate eligibility, assign owner, and change state
- conflicting claims must fail with a machine-usable conflict error

### Markdown revision conflicts

When two actors try to update the same card markdown concurrently:

- stale updates must fail with `revision_conflict` or equivalent stable machine-usable error

## Source-of-Truth Requirements

The MVP must preserve layered truth:

- repo is authoritative for code and artifacts
- Kanban is authoritative for task process and progress
- pre-MVP planning may exist in repo docs
- post-bootstrapping active planning must move into the system

## Bootstrapping Requirement

The system must be able to:

1. backfill past work into cards
2. plan new work using cards
3. execute work using agents through CLI
4. record progress and comments
5. review and finalize work

## Bootstrapping DoD

The system is considered successful when all of the following are true:

### Runtime success

- the system runs locally
- agents can interact with it through CLI
- humans can inspect and review it through the web UI

### Mechanism success

- at least one repo draft card is backfilled into the running system
- at least one agent completes a full workflow using CLI:

  * list
  * show
  * update
  * comment
  * transition
- at least one card passes through review gate and reaches Done
- at least one card includes Final Summary and DoD Check
- at least one repo artifact is explicitly linked from a completed card

### Self-management success

- new work is planned through the running system
- the system is used to manage at least part of its own future development

## Seed Doc Handling

Bootstrap planning docs may remain in the repo after backfill, but:

- they should no longer act as the active task tracker
- they should be marked as historical or backfilled
- active task state should live in the running system

Recommended marking approaches:

- front matter such as `status: backfilled`
- dedicated seed-doc directory
- filename convention indicating historical status

## Policy Requirements

V1 must support minimal project policy controls, including:

- whether agent review is allowed
- whether self-review is allowed
- whether agents may pick unassigned Ready cards
- default selection policy

## Non-goals

V1 does not require:

- multi-owner cards
- blocked state
- workflow engine
- complex approval object model
- real-time collaborative markdown editing
- distributed execution runtime

## Success Criteria

The MVP is successful when:

- agents can reliably read and act on cards
- humans can understand project progress through UI
- repo and Kanban remain consistent in their respective truth layers
- the system can transition from repo-first planning to self-management without ambiguity
