# Workflow Contract

## Purpose

This document defines the minimum executable workflow rules for V1.

The system intentionally avoids becoming a workflow engine, but it still needs a strict enough contract so that agents, humans, CLI, API, and UI all behave consistently.

## State Model

Cards move through the following states:

- New
- Ready
- In Progress
- In Review
- Done

V1 does not include a Blocked state.

## Actor Model

The only real actor types in this system are:

- human
- agent

The system does not model a separate `reviewer` role as a first-class domain concept.

A review gate is still required, but it is expressed as an allowed action performed by a human or an agent under project policy.

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

## Review Gate

In Review is a real gate, not a visual placeholder.

A card should not move to Done merely because execution appears complete.

The gate is passed by an allowed action from either:

- a human
- an agent

Whether a given human or agent is allowed to pass the gate is controlled by project policy and backend rules, not by a dedicated card field.

By default, owner and gate-passer should be treated as different actors unless a project explicitly allows self-review.

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

- owner must be set

Who can trigger:

- human
- assigned owner
- agent acting under explicit human instruction
- agent picking an unassigned Ready card only if project policy allows it

Required side effects:

- claim should atomically verify eligibility, assign owner, and change state
- record `state_changed`
- record `owner_assigned` if owner changes in the same operation

### In Progress → In Review

Meaning:

- execution work is complete enough for review

Required conditions:

- owner exists
- execution results are available in repo or referenced artifacts

Who can trigger:

- current owner
- human supervising the work

Required side effects:

- record `state_changed`

### In Review → Done

Meaning:

- review is complete and the card is considered finished

Required conditions:

- Final Summary exists
- DoD Check is filled or explicitly addressed
- review gate is explicitly passed by an allowed human or agent action

Who can trigger:

- human allowed by project policy
- agent allowed by project policy

Required side effects:

- record `state_changed`
- record summary update if it happened as part of completion

### In Review → In Progress

Meaning:

- review failed or further changes are required

Required conditions:

- review comments or rationale should exist

Who can trigger:

- human allowed by project policy
- agent allowed by project policy

Required side effects:

- record `state_changed`
- add comment or event indicating reason for return

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
- In Review without owner
- In Review → Done without Final Summary

## Error Contract

The API should return machine-usable workflow errors.

Suggested stable error types:

- `invalid_transition`
- `missing_owner`
- `missing_required_section`
- `review_gate_not_passed`
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
