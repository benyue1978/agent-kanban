# Spec: Enhance CLI for Agent UX and Discoverability

## 1. Goal
Improve the `kanban` CLI to be a "precision-engineered" tool for agents and humans. The focus is on robust command discovery (human and machine-readable), better error reporting, and local context management.

## 2. Architecture
The CLI will be refactored to use **Commander.js** for command registration, argument parsing, and help generation. This replaces the current manual parsing logic in `index.ts`.

### 2.1 Command Structure
Commands will follow the `kanban <resource> <action>` pattern:
- `kanban cards <list|show|create|assign-owner|set-state|update|append-summary|comment>`
- `kanban projects <list|create>`
- `kanban config`
- `kanban discovery` (New: outputs machine-readable command metadata)

### 2.2 Global Options
- `--api-url <url>`: Override API endpoint.
- `--actor <id>`: Set the actor performing the action.
- `--json`: Force JSON output for all commands and errors.
- `--dry-run`: (New) Validates arguments and state but skips the final API call.

## 3. Key Features

### 3.1 Robust Discovery
- **Human Help**: Standard `--help` support for every resource and action, providing detailed flag descriptions.
- **Machine Discovery**: `kanban discovery --json` will return a JSON object describing all available commands, their required/optional flags, and description text.

### 3.2 Error Handling
A global error handler will catch all exceptions:
- **CLI Usage Errors**: (e.g., unknown flag, missing required argument) mapped to `cli_usage_error` code when `--json` is present.
- **API Errors**: Preserve existing `CliApiError` mapping for backend failures.

### 3.3 Local Configuration (`.kanban.json`)
The CLI will look for a `.kanban.json` file in the current working directory to provide defaults:
```json
{
  "apiUrl": "http://127.0.0.1:3001",
  "actorId": "agent",
  "projectId": "..." 
}
```
*Note: `projectId` can still be inferred from the git origin URL if not provided.*

### 3.4 ID Resolution and Search
- **Project Inference**: Enhance `resolveProjectId` to use the git origin URL by default.
- **Search Command**: Add a `kanban cards search --query <text>` or similar to help agents resolve titles to IDs without listing everything.

## 4. Implementation Details

### 4.1 Dependency Addition
Add `commander` to `apps/cli/package.json`.

### 4.2 Error Mapping Example (JSON)
```json
{
  "error": {
    "code": "cli_usage_error",
    "message": "error: unknown option '--project-id'",
    "command": "cards create",
    "suggested_help": "kanban cards create --help"
  }
}
```

## 5. Verification Plan
- **Automated Tests**:
  - Verify `--help` output for all commands.
  - Verify `discovery --json` returns valid schema.
  - Verify `.kanban.json` overrides defaults correctly.
  - Verify `cli_usage_error` is returned for invalid flags.
- **Manual Verification**:
  - Run `kanban discovery --json` as an agent to verify it can be parsed for next steps.
