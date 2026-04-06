# CLI Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the `kanban` CLI to use Commander.js, providing robust discovery, JSON error mapping, and local configuration support for better agent UX.

**Architecture:** Use Commander.js for structured command definition and flag parsing. Implement a central discovery mechanism and a global error handler for standardized output.

**Tech Stack:** Node.js, TypeScript, Commander.js.

---

### Task 1: Add Commander.js and Core Structure

**Files:**
- Modify: `apps/cli/package.json`
- Modify: `apps/cli/src/index.ts`

- [ ] **Step 1: Install commander**
Run: `pnpm --filter @agent-kanban/cli add commander`

- [ ] **Step 2: Update index.ts to use Commander**
Refactor the main entry point to use `Command` from `commander`. 
```typescript
import { Command } from "commander";
const program = new Command();
program.name("kanban").description("Kanban CLI for humans and agents");
// ... add commands ...
program.parse();
```

- [ ] **Step 3: Commit**
```bash
git add apps/cli/package.json apps/cli/src/index.ts
git commit -m "feat(cli): add commander and basic structure"
```

### Task 2: Implement Discovery Command

**Files:**
- Create: `apps/cli/src/commands/discovery.ts`
- Modify: `apps/cli/src/index.ts`

- [ ] **Step 1: Create discovery command**
Implement a command that iterates over the `program.commands` and builds a JSON schema of all available commands and flags.

- [ ] **Step 2: Register discovery command**
Add `kanban discovery --json` to the main program.

- [ ] **Step 3: Commit**
```bash
git add apps/cli/src/commands/discovery.ts apps/cli/src/index.ts
git commit -m "feat(cli): add discovery command"
```

### Task 3: JSON Error Mapping

**Files:**
- Modify: `apps/cli/src/index.ts`
- Modify: `apps/cli/src/commands/common.ts`

- [ ] **Step 1: Global error handler**
Update the catch block in `index.ts` to detect Commander validation errors and map them to `cli_usage_error`.

- [ ] **Step 2: Commit**
```bash
git add apps/cli/src/index.ts
git commit -m "feat(cli): implement standardized JSON error mapping"
```

### Task 4: Local Configuration Support

**Files:**
- Modify: `apps/cli/src/commands/common.ts`

- [ ] **Step 1: Load .kanban.json**
Update the CLI to check the current directory for `.kanban.json` and merge its values into the configuration.

- [ ] **Step 2: Commit**
```bash
git add apps/cli/src/commands/common.ts
git commit -m "feat(cli): add support for .kanban.json defaults"
```

### Task 5: Migrate All Commands and Add Dry-run

**Files:**
- Modify: All files in `apps/cli/src/commands/`
- Modify: `apps/cli/src/index.ts`

- [ ] **Step 1: Complete migration**
Ensure all existing commands are fully registered with Commander and respect the new configuration hierarchy.

- [ ] **Step 2: Implement --dry-run**
Add a global `--dry-run` flag that causes commands to output their intended action without calling the API.

- [ ] **Step 3: Commit**
```bash
git add apps/cli/src/
git commit -m "feat(cli): finish migration and add dry-run"
```
