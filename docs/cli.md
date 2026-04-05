# CLI Specification

## Overview

CLI is the primary interface for agents.

Agents interact with the system through CLI commands, not direct database or UI access.

## Principles

- CLI should be simple and predictable
- CLI should expose core operations only
- Markdown should remain the main flexible editing interface
- Critical operations should also have structured commands

## Connection Model

An agent session should have access to:

- current repo context
- target `kanban_url`
- actor identity / auth

A V1 implementation may provide these via:

- current working directory
- local config file
- environment variables
- explicit CLI flags

Recommended conceptual model:

- `repo_url` = logical repository identity
- local cwd / repo_path = local execution context
- `kanban_url` = task system endpoint

`kanban_url` is runtime/session connection config, not project domain identity.

## Commands

### List projects

`kanban projects list`

### List cards

`kanban cards list`
`kanban cards list --assigned-to me`
`kanban cards list --state ready`

### Show card

`kanban cards show --id <card_id>`

### Create card

`kanban cards create --title "..."`

### Full markdown update

`kanban cards show --id 123 > card.md`
edit card.md
`kanban cards update --id 123 --file card.md --revision <known_revision>`

### Structured state update

`kanban cards set-state --id 123 --to in-progress --owner <collaborator>`

### Structured owner assignment

`kanban cards assign-owner --id 123 --to <collaborator>`

### Structured summary update

`kanban cards append-summary --id 123 --file summary.md`

### Add comment

`kanban cards comment --id 123 --body "..." --kind progress --author <collaborator>`

## Structured Command Result Contract

This document is the normative source for structured command input/output expectations.

Structured commands should return machine-usable results.

Where relevant, responses should include:

- card id
- new revision
- resulting state
- owner
- machine-usable error on failure

## Behavior

- CLI calls backend API
- CLI outputs markdown or JSON
- CLI should be composable in scripts

## Agent Usage Pattern

Typical flow:

1. list tasks
2. pick project if inference is ambiguous
3. pick task
4. show card
5. execute work in repo
6. update card through either full markdown update or structured commands
7. add comments
8. move state

## Recommended Usage

For agent workflows:

- prefer structured commands for state, ownership, summary, and comments
- use full markdown roundtrip when editing planning content or larger descriptive sections

## Non-goals

- CLI is not a full workflow engine
- CLI does not enforce heavy logic by itself
- CLI does not bypass backend workflow validation
