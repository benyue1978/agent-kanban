# Card Specification

## Overview

A card is the core execution unit of the system.

It acts as a lightweight harness that provides context for a task.

## Structure

Card description is markdown with a recommended structure.

### Canonical template

See `assets/card-template.md` for the canonical card skeleton for V1.

Protected headings should remain stable so that both humans and agents can use the same template safely.

## Rules

- the upper sections are used for planning and may drift
- Final Summary is the authoritative summary
- Final Summary must be filled before Done
- protected section headings should remain stable so that backend and agents can safely identify them

## Editing Model

- Agents and humans can update markdown
- Markdown is treated as the primary editable content
- Full markdown update should use revision checking
- Critical fields should also have structured command paths

## Semantics

### Planning Layer

- Goal
- Context
- Scope
- Definition of Done
- Constraints
- Plan

These guide execution.

### Execution Layer

- Comments record actions, questions, and decisions through the workflow

### Summary Layer

- Final Summary captures the stable outcome

## DoD Usage

Definition of Done should:

- be explicit
- be testable where possible
- guide execution and completion

## Completion Summary

Before a card moves from In Progress to Done:

- Final Summary must exist
- verification evidence must be present on the card timeline

`DoD Check` remains a useful optional section inside Final Summary, but it is no longer a hard workflow gate in V1.

## Relationship to Repo

- Detailed artifacts live in repo
- Card references artifacts
- Card does not duplicate full documents

## Anti-patterns

- Storing full design documents in card
- Using comments as final result
- Overwriting Goal/DoD after execution without human intent
- Renaming protected section headings in ways that break safe updates
