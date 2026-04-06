# CLI Specification

## Overview

The `kanban` CLI is the primary interface for agents and a power-user tool for humans. It provides structured commands for managing projects, cards, and collaborator actions.

## Principles

- **Predictability**: Use standard `commander.js` patterns for flags and subcommands.
- **Machine-Friendly**: Robust JSON output support (`--json`) for all commands and errors.
- **Discoverability**: Built-in help (`--help`) and a machine-readable `discovery` command.
- **Safety**: Support for `--dry-run` to validate operations without side effects.

## Connection Model

The CLI determines its configuration using the following priority:
1. **CLI Flags**: `--api-url`, `--actor`.
2. **Local Configuration**: `.kanban.json` in the current working directory.
3. **Environment Variables**: `KANBAN_API_URL`, `KANBAN_ACTOR_ID`.
4. **Hardcoded Defaults**: `http://127.0.0.1:3001`.

### Local Config (`.kanban.json`)
```json
{
  "apiUrl": "http://127.0.0.1:3001",
  "actorId": "agent",
  "projectId": "cmnlvfehm..."
}
```

## Global Options

- `--api-url <url>`: Override the target API endpoint.
- `--actor <id>`: Set the actor performing the action (default: `agent`).
- `--json`: Force output in JSON format (including errors).
- `--dry-run`: Validate arguments and state but skip the final API call.

## Commands

### Discovery & Config

#### `kanban discovery`
Outputs a machine-readable JSON schema of all available commands, options, and descriptions.
`kanban discovery --json`

#### `kanban config`
Displays the resolved configuration (API URL and Actor ID).
`kanban config --json`

### Collaborators

#### `kanban collaborators list`
Lists all collaborators in the system. Use this to find valid `actorId` or `ownerId` values.
`kanban collaborators list [--json]`

### Projects

#### `kanban projects list`
Lists all projects in the system.

#### `kanban projects create`
Creates a new project.
`kanban projects create --repo-url <url> [--name <name>] [--description <text>] [--policy-file <path>]`

### Cards

#### `kanban cards list`
Lists cards, optionally filtered by project, state, or owner.
`kanban cards list [--project <id>] [--state <state>] [--assigned-to <id|me>]`

#### `kanban cards show`
Shows full details for a specific card.
`kanban cards show --id <card-id>`

#### `kanban cards create`
Creates a new card.
`kanban cards create --title <title> [--project <id>] [--description-file <path>] [--priority <n>]`

#### `kanban cards assign-owner`
Assigns or unassigns an owner.
`kanban cards assign-owner --id <card-id> --to <owner-id|none>`

#### `kanban cards set-state`
Transitions a card to a new workflow state.
`kanban cards set-state --id <card-id> --to <new|ready|in-progress|done> [--owner <id>] [--revision <n>]`

#### `kanban cards update`
Performs a full markdown update of the card description.
`kanban cards update --id <card-id> --file <path> --revision <n>`

#### `kanban cards append-summary`
Appends content to the card's final summary.
`kanban cards append-summary --id <card-id> --file <path>`

#### `kanban cards comment`
Adds a collaborative comment to the card timeline.
`kanban cards comment --id <card-id> --body <text> --kind <progress|question|decision|note|verification> [--author <id>]`

## Error Contract

When `--json` is enabled, errors are returned as a JSON object:

### API Error
```json
{
  "error": {
    "code": "revision_conflict",
    "message": "stale revision"
  }
}
```

### CLI Usage Error
```json
{
  "error": {
    "code": "cli_usage_error",
    "message": "error: missing required flag --id"
  }
}
```
