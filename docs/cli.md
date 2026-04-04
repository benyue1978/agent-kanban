# CLI Specification

## Overview

CLI is the primary interface for agents.

Agents interact with the system through CLI commands, not direct database or UI access.

## Principles

- CLI should be simple and predictable
- CLI should expose core operations only
- Markdown should be the main editing interface

## Commands

### List cards

```
kanban list
kanban list --assigned-to me
kanban list --state Ready
```

### Show card

```
kanban show --id <card_id>
```

### Create card

```
kanban create --title "..."
```

### Update card markdown

```
kanban show --id 123 > card.md
# edit card.md
kanban update-card --id 123 --file card.md
```

### Update state

```
kanban update-state --id 123 --to "In Progress"
```

### Assign owner

```
kanban assign --id 123 --to <collaborator>
```

### Add comment

```
kanban comment --id 123 --body "..."
```

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
5. update card
6. add comments
7. move state

## Non-goals

- CLI is not a full workflow engine
- CLI does not enforce heavy logic
