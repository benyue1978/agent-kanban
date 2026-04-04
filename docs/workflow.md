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

- owner must be set

Who can trigger:

- human
- assigned owner
- agent acting under explicit human instruction

Recommended behavior:

- assigning owner and moving to In Progress should be treated as one logical action when possible

Required side effects:

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
- review gate is explicitly passed

Who can trigger:

- human reviewer
- reviewer agent if the project configuration allows agent review

Required side effects:

- record `state_changed`
- record summary update if it happened as part of completion

### In Review → In Progress

Meaning:

- review failed or further changes are required

Required conditions:

- review comments or rationale should exist

Who can trigger:

- human reviewer
- reviewer agent if project configuration allows it

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

## Review Gate

In Review is a real gate, not a visual placeholder.

A card should not move to Done merely because execution appears complete.

Someone or something configured as reviewer must pass the gate.
