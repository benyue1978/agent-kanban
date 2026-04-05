# Workflow Contract

## Purpose

This document defines the minimum executable workflow rules for V1.

The system intentionally avoids becoming a workflow engine, but it still needs a strict enough contract so that agents, humans, CLI, API, and UI all behave consistently.

## State Model

Cards move through the following states:

- New
- Ready
- In Progress
- Done

V1 does not include a Blocked state.

## Actor Model

The only real actor types in this system are:

- human
- agent

The system does not model a separate `reviewer` role as a first-class domain concept.

Review is still required as completion discipline, but it is represented through summary quality, verification evidence, comments, and event history rather than a dedicated workflow state.

## Owner Definition

A card has exactly one `owner` at a time.

The `owner` means:

- the primary collaborator currently responsible for advancing the card
- the actor that should be considered the main point of responsibility for the current stage of the card

The `owner` does **not** mean:

- the temporary worker process currently executing code
- an internal spawned subagent
- a full list of every actor that touched the card

Subagents are execution details and should not be represented as first-class owners in V1.

## Transition Table

### New → Ready

Meaning:

- the card is defined enough to be taken into execution

Minimum expected conditions:

- title exists
- Goal exists
- Definition of Done exists
- Scope is sufficiently clear for execution

Who can trigger:

- human
- agent acting under explicit human instruction

Required side effects:

- record `state_changed` event

### Ready → In Progress

Meaning:

- the card is now actively being worked on

Required conditions:

- owner must be set as part of the claim

Who can trigger:

- human
- assigned owner
- agent acting under explicit human instruction
- agent picking an unassigned Ready card only if project policy allows it

Required side effects:

- claim should atomically verify eligibility, assign owner, and change state
- record `state_changed`
- record `owner_assigned` if owner changes in the same operation

### In Progress → Done

Meaning:

- execution work is complete and verified enough to finish

Required conditions:

- owner exists
- Final Summary exists
- verification evidence exists on the card timeline

Who can trigger:

- current owner
- human supervising the work

Required side effects:

- record `state_changed`
- preserve the verification comments or events that justify completion

## Optional Reopen Rules

V1 may allow reopening a finished card, but this should be explicit.

### Done → In Progress

Use only when:

- work must be reopened due to defect, incomplete result, or changed requirement

Required behavior:

- add rationale comment or event
- keep prior Final Summary as historical context, then update later if needed

## Explicitly Invalid Transitions

The backend should reject transitions such as:

- New → In Progress without first becoming Ready
- Ready → Done
- New → Done
- In Progress → Done without owner
- In Progress → Done without Final Summary
- In Progress → Done without verification evidence

## Error Contract

The API should return machine-usable workflow errors.

Suggested stable error types:

- `invalid_transition`
- `missing_owner`
- `missing_required_section`
- `summary_required`
- `forbidden_action`
- `revision_conflict`
- `claim_conflict`

CLI and agent skills should be able to react to these errors predictably.

## Archive Rules

- cards are not deleted
- archive is separate from Done
- a card may be archived from any terminal or obsolete state by human action
- archiving should record an event

## Enforcement Principle

The API should enforce workflow rules.

CLI and UI should reflect those rules, but the backend must remain the source of workflow validation.

## Minimal Scheduling Principle

V1 does not include a workflow engine, but it does need minimal execution discipline.

### Minimum rules

- only Ready cards should normally be taken into In Progress
- taking a card into In Progress should require an owner
- humans can force reassignment
- agents should prefer assigned cards first
- if agents are allowed to pick unassigned cards, they should only pick from Ready cards

### Default selection policy

When multiple cards are eligible, the default order should be:

1. higher priority first
2. then older Ready cards first
3. then older updated-at timestamps to reduce starvation

This is a default policy, not a workflow engine.
