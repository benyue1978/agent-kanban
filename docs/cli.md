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

## Commands

### List cards

`kanban list`
`kanban list --assigned-to me`
`kanban list --state Ready`

### Show card

`kanban show --id <card_id>`

### Create card

`kanban create --title "..."`

### Full markdown update

`kanban show --id 123 > card.md`
edit card.md
`kanban update-card --id 123 --file card.md --revision <known_revision>`

### Structured state update

`kanban set-state --id 123 --to "In Progress"`

### Structured owner assignment

`kanban assign-owner --id 123 --to <collaborator>`

### Structured summary update

`kanban append-summary --id 123 --file summary.md`

### Add comment

`kanban comment --id 123 --body "..." --kind progress`

## Structured command result contract

Structured commands should return machine-usable results including, where relevant:

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
2. pick task
3. show card
4. execute work in repo
5. update card through either full markdown update or structured commands
6. add comments
7. move state

## Recommended Usage

For agent workflows:

- prefer structured commands for state, ownership, summary, and comments
- use full markdown roundtrip when editing planning content or larger descriptive sections

## Non-goals

- CLI is not a full workflow engine
- CLI does not enforce heavy logic by itself
- CLI does not bypass backend workflow validation
