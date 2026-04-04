# Project Policy

## Purpose

This document defines the minimal project-level policy surface used by workflow, CLI, backend, and UI.

The goal is to avoid hidden behavior or duplicated defaults across implementations.

## Minimal Policy Fields

### allow_agent_review

Type:

- boolean

Meaning:

- whether an agent is allowed to pass the In Review → Done gate

### allow_self_review

Type:

- boolean

Meaning:

- whether the same actor that owns or executed the card is allowed to pass the review gate

### allow_agent_pick_unassigned_ready

Type:

- boolean

Meaning:

- whether an agent may claim an unassigned Ready card without explicit human assignment

### default_selection_policy

Type:

- enum / string

Suggested values:

- `priority_then_ready_age_then_updated_at`

Meaning:

- default ordering rule used when multiple cards are eligible

### allowed_transition_actors

Type:

- mapping / policy table

Meaning:

- which actor types are allowed to perform specific transitions

This field should stay small in V1. It is not intended to become a general ACL system.

## Minimal Example Shape

A V1 policy may represent transition actors conceptually like this:

- `new_to_ready: [human, agent_if_explicit_human_instruction]`
- `ready_to_in_progress: [human, owner, agent_if_policy_allows_pick]`
- `in_progress_to_in_review: [owner, human]`
- `in_review_to_done: [human, agent_if_allow_agent_review]`
- `in_review_to_in_progress: [human, agent_if_allow_agent_review]`

The exact implementation can vary, but the meaning should remain consistent.

## Recommended Defaults for V1

- `allow_agent_review = false`
- `allow_self_review = false`
- `allow_agent_pick_unassigned_ready = false`
- `default_selection_policy = priority_then_ready_age_then_updated_at`

## Why this matters

Without an explicit policy document:

- workflow behavior gets duplicated
- backend, CLI, and UI may diverge
- agent behavior becomes harder to predict

Policy should remain small in V1.

This document is not intended to become a large permissions framework.
