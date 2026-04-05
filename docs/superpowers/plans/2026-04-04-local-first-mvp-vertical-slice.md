# Local-First MVP Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first runnable local-first `agent-kanban` slice with a dedicated API, CLI, review-oriented web UI, PostgreSQL persistence, and bootstrap import of seed cards.

**Architecture:** Use a `pnpm` workspace monorepo with three apps (`api`, `cli`, `web`) and three shared packages (`contracts`, `domain`, `card-markdown`). The Fastify API is the only workflow authority, the CLI and Next.js UI call only the API, and PostgreSQL stores process truth while markdown remains the card content source.

**Tech Stack:** Node.js 24, TypeScript, pnpm workspaces, Fastify, Prisma, PostgreSQL 18 via Docker Compose, Next.js, Commander, Vitest, Playwright

---

## Environment Preflight

Verified in the planning session:

- `node -v` -> `v24.14.1`
- `npm -v` -> `11.12.1`
- `pnpm -v` -> `10.33.0`
- `psql --version` -> `PostgreSQL 18.3`
- `docker --version` -> `28.5.2`
- `docker compose version` -> `v2.40.3`
- repo manifests present at plan time -> none

Implications for execution:

- use `pnpm` as the workspace package manager
- use Docker Compose for PostgreSQL-backed integration tests
- use `psql` for quick database inspection during debugging
- install Playwright browser binaries during the web chunk before smoke tests

## File Structure

### Root workspace files

- Create: `.gitignore`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.workspace.ts`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `scripts/check-tooling.mjs`

### Shared packages

- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/card.ts`
- Create: `packages/contracts/src/errors.ts`
- Create: `packages/contracts/src/policy.ts`
- Create: `packages/contracts/tests/contracts.test.ts`

- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/src/workflow.ts`
- Create: `packages/domain/src/policy.ts`
- Create: `packages/domain/src/selection.ts`
- Create: `packages/domain/tests/workflow.test.ts`

- Create: `packages/card-markdown/package.json`
- Create: `packages/card-markdown/tsconfig.json`
- Create: `packages/card-markdown/src/index.ts`
- Create: `packages/card-markdown/src/anchors.ts`
- Create: `packages/card-markdown/src/summary.ts`
- Create: `packages/card-markdown/tests/card-markdown.test.ts`

### API app

- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/config.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/lib/auth.ts`
- Create: `apps/api/src/repositories/project-repository.ts`
- Create: `apps/api/src/repositories/card-repository.ts`
- Create: `apps/api/src/repositories/comment-repository.ts`
- Create: `apps/api/src/services/card-service.ts`
- Create: `apps/api/src/services/comment-service.ts`
- Create: `apps/api/src/services/inbox-service.ts`
- Create: `apps/api/src/routes/projects.ts`
- Create: `apps/api/src/routes/cards.ts`
- Create: `apps/api/src/routes/inbox.ts`
- Create: `apps/api/tests/integration/project-card-repository.test.ts`
- Create: `apps/api/tests/integration/workflow-routes.test.ts`
- Create: `apps/api/tests/integration/comment-inbox.test.ts`

### CLI app

- Create: `apps/cli/package.json`
- Create: `apps/cli/tsconfig.json`
- Create: `apps/cli/src/index.ts`
- Create: `apps/cli/src/client.ts`
- Create: `apps/cli/src/commands/list.ts`
- Create: `apps/cli/src/commands/show.ts`
- Create: `apps/cli/src/commands/create.ts`
- Create: `apps/cli/src/commands/assign-owner.ts`
- Create: `apps/cli/src/commands/set-state.ts`
- Create: `apps/cli/src/commands/update-card.ts`
- Create: `apps/cli/src/commands/append-summary.ts`
- Create: `apps/cli/src/commands/comment.ts`
- Create: `apps/cli/tests/cli.test.ts`

### Web app

- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/projects/[projectId]/page.tsx`
- Create: `apps/web/app/cards/[cardId]/page.tsx`
- Create: `apps/web/app/inbox/page.tsx`
- Create: `apps/web/components/board-column.tsx`
- Create: `apps/web/components/card-tile.tsx`
- Create: `apps/web/components/card-detail.tsx`
- Create: `apps/web/components/comment-list.tsx`
- Create: `apps/web/components/review-actions.tsx`
- Create: `apps/web/components/inbox-list.tsx`
- Create: `apps/web/lib/api.ts`
- Create: `apps/web/tests/board-and-card.spec.ts`
- Create: `apps/web/tests/inbox-and-review.spec.ts`

### Bootstrap tooling

- Create: `scripts/backfill-initial-cards.ts`
- Create: `scripts/verify-vertical-slice.mjs`

## Chunk 1: Workspace And Shared Core

### Task 1: Bootstrap the workspace and tool checks

**Files:**
- Create: `.gitignore`
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `vitest.workspace.ts`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `scripts/check-tooling.mjs`

- [ ] **Step 1: Capture the failing preflight baseline**

Run: `node scripts/check-tooling.mjs`
Expected: Node exits with `MODULE_NOT_FOUND` or `ENOENT` because the script does not exist yet.

- [ ] **Step 2: Create the root workspace files and tooling script**

Use this shape:

```json
{
  "name": "agent-kanban",
  "private": true,
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "check:tooling": "node scripts/check-tooling.mjs",
    "db:up": "docker compose up -d postgres",
    "db:down": "docker compose down",
    "db:reset": "docker compose down -v",
    "test": "pnpm -r test"
  },
  "devDependencies": {
    "typescript": "^5.9.0",
    "vitest": "^3.2.0",
    "tsx": "^4.20.0"
  }
}
```

```js
// scripts/check-tooling.mjs
import { spawnSync } from 'node:child_process';

const nodeMajor = Number.parseInt(process.versions.node.split('.')[0] ?? '', 10);
const pnpmVersion = spawnSync('pnpm', ['-v'], { encoding: 'utf8' });
const pnpmVersionText = (pnpmVersion.stdout || pnpmVersion.stderr || '').trim();
const pnpmMajor = Number.parseInt(pnpmVersionText.split('.')[0] ?? '', 10);
const composeMinMajor = 2;

let failed = false;

function fail(message) {
  failed = true;
  console.error(message);
}

if (nodeMajor !== 24) {
  fail(`unsupported:node:${process.versions.node}`);
} else {
  console.log(`node: ${process.versions.node}`);
}

if (pnpmVersion.status !== 0 || pnpmVersion.error) {
  fail('missing:pnpm');
} else if (pnpmMajor !== 10) {
  fail(`unsupported:pnpm:${pnpmVersionText}`);
} else {
  console.log(`pnpm: ${pnpmVersionText}`);
}

const checks = [
  ['docker', ['--version']],
  ['psql', ['--version']],
];

for (const [command, args] of checks) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.status !== 0) {
    failed = true;
    console.error(`missing:${command}`);
  } else {
    console.log(`${command}: ${result.stdout.trim()}`);
  }
}

const composeResult = spawnSync('docker', ['compose', 'version'], { encoding: 'utf8' });
const composeText = (composeResult.stdout || composeResult.stderr || '').trim();

if (composeResult.status !== 0 || composeResult.error) {
  failed = true;
  console.error('missing:docker-compose');
} else {
  const composeMajorMatch = composeText.match(/v?(\\d+)\\./);
  const composeMajor = composeMajorMatch ? Number.parseInt(composeMajorMatch[1], 10) : Number.NaN;

  if (!Number.isFinite(composeMajor) || composeMajor < composeMinMajor) {
    failed = true;
    console.error(`unsupported:docker-compose:${composeText}`);
  } else {
    console.log(`docker compose: ${composeText}`);
  }
}

process.exit(failed ? 1 : 0);
```

Add `.superpowers/`, `.next/`, `node_modules/`, `coverage/`, `.env*`, and generated Prisma files to `.gitignore`.

- [ ] **Step 3: Run the preflight check and install dependencies**

Run:

```bash
node scripts/check-tooling.mjs
pnpm install
```

Expected:

- the tooling script prints versions for `node`, `pnpm`, `docker`, `docker compose`, and `psql`
- `pnpm install` creates `pnpm-lock.yaml` and completes without workspace errors

- [ ] **Step 4: Verify Docker-backed PostgreSQL can start**

Run:

```bash
pnpm db:up
docker compose ps
pnpm db:down
```

Expected:

- the `postgres` service reaches a running state
- `docker compose ps` shows the container as healthy or running
- `db:down` stops the service without deleting the volume; use `db:reset` when you want a destructive reset

- [ ] **Step 5: Commit**

```bash
git add .gitignore package.json pnpm-workspace.yaml tsconfig.base.json vitest.workspace.ts .env.example docker-compose.yml scripts/check-tooling.mjs pnpm-lock.yaml
git commit -m "chore: bootstrap workspace tooling"
```

### Task 2: Create the shared contracts package

**Files:**
- Create: `packages/contracts/package.json`
- Create: `packages/contracts/tsconfig.json`
- Create: `packages/contracts/src/index.ts`
- Create: `packages/contracts/src/card.ts`
- Create: `packages/contracts/src/errors.ts`
- Create: `packages/contracts/src/policy.ts`
- Test: `packages/contracts/tests/contracts.test.ts`

- [ ] **Step 1: Write the failing contracts test**

```ts
import { describe, expect, it } from 'vitest';
import { CardState, errorCodes, defaultProjectPolicy } from '../src/index';

describe('contracts', () => {
  it('exports the canonical workflow states', () => {
    expect(CardState.Done).toBe('Done');
  });

  it('exports stable error codes', () => {
    expect(errorCodes).toContain('revision_conflict');
    expect(errorCodes).toContain('claim_conflict');
  });

  it('exports the documented default project policy', () => {
    expect(defaultProjectPolicy.allowAgentReview).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter @agent-kanban/contracts test`
Expected: FAIL because the package and exports do not exist yet.

- [ ] **Step 3: Implement the contracts package**

Export:

- `CardState`
- `CommentKind`
- `InboxItemStatus`
- `errorCodes`
- `defaultProjectPolicy`
- request and response interfaces shared by API, CLI, and web

Keep the package dependency-free except for TypeScript tooling.

- [ ] **Step 4: Run the contracts test to verify it passes**

Run: `pnpm --filter @agent-kanban/contracts test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/contracts
git commit -m "feat: add shared contracts package"
```

### Task 3: Implement workflow and policy rules in the domain package

**Files:**
- Create: `packages/domain/package.json`
- Create: `packages/domain/tsconfig.json`
- Create: `packages/domain/src/index.ts`
- Create: `packages/domain/src/workflow.ts`
- Create: `packages/domain/src/policy.ts`
- Create: `packages/domain/src/selection.ts`
- Test: `packages/domain/tests/workflow.test.ts`

- [ ] **Step 1: Write the failing workflow tests**

```ts
import { describe, expect, it } from 'vitest';
import { canTransition, sortReadyCards } from '../src/index';

describe('workflow', () => {
  it('rejects Ready -> Done', () => {
    expect(() =>
      canTransition({ from: 'Ready', to: 'Done', actorType: 'human' })
    ).toThrowError(/invalid_transition/);
  });

  it('requires summary before In Progress -> Done', () => {
    expect(() =>
      canTransition({
        from: 'In Progress',
        to: 'Done',
        actorType: 'human',
        summaryPresent: false,
      })
    ).toThrowError(/summary_required/);
  });

  it('sorts Ready cards by priority then age then updated time', () => {
    const result = sortReadyCards([
      { id: 'b', priority: 2, readyAt: 2, updatedAt: 20 },
      { id: 'a', priority: 1, readyAt: 1, updatedAt: 10 },
    ]);
    expect(result[0].id).toBe('a');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @agent-kanban/domain test`
Expected: FAIL because the package and workflow functions do not exist yet.

- [ ] **Step 3: Implement the domain package**

Implement:

- explicit transition validation
- policy checks for unassigned Ready pickup
- selection ordering helper
- stable thrown errors that use the shared error codes

Keep the package pure. It must not depend on Fastify, Prisma, or React.

- [ ] **Step 4: Run the domain tests**

Run: `pnpm --filter @agent-kanban/domain test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/domain
git commit -m "feat: add workflow domain rules"
```

### Task 4: Implement protected-heading markdown helpers

**Files:**
- Create: `packages/card-markdown/package.json`
- Create: `packages/card-markdown/tsconfig.json`
- Create: `packages/card-markdown/src/index.ts`
- Create: `packages/card-markdown/src/anchors.ts`
- Create: `packages/card-markdown/src/summary.ts`
- Test: `packages/card-markdown/tests/card-markdown.test.ts`

- [ ] **Step 1: Write the failing markdown tests**

```ts
import { describe, expect, it } from 'vitest';
import { getProtectedSections, validateCompletionSummary } from '../src/index';

const sample = `# Card

## Goal
Ship the API

## Scope
Create the service

## Definition of Done
- [ ] tests

## Final Summary
### What was done
Built the API

### DoD Check
- [x] tests`;

describe('card markdown', () => {
  it('finds protected sections', () => {
    expect(getProtectedSections(sample).finalSummary).toContain('What was done');
  });

  it('rejects completion when summary is missing', () => {
    expect(() => validateCompletionSummary('# Card')).toThrowError(/summary_required/);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter @agent-kanban/card-markdown test`
Expected: FAIL because the package and parser do not exist yet.

- [ ] **Step 3: Implement the markdown package**

Implement:

- protected heading detection for all required sections
- summary validation for `In Progress -> Done`
- helper for safe summary appends

Do not implement a general markdown AST editor in this slice.

- [ ] **Step 4: Run the markdown tests**

Run: `pnpm --filter @agent-kanban/card-markdown test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add packages/card-markdown
git commit -m "feat: add card markdown guards"
```

## Chunk 2: API And Persistence

### Task 5: Create the API app, database schema, and repositories

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/config.ts`
- Create: `apps/api/src/app.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/lib/prisma.ts`
- Create: `apps/api/src/lib/auth.ts`
- Create: `apps/api/src/repositories/project-repository.ts`
- Create: `apps/api/src/repositories/card-repository.ts`
- Create: `apps/api/tests/integration/project-card-repository.test.ts`

- [ ] **Step 1: Write the failing repository integration test**

```ts
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createTestPrisma, resetDatabase } from './test-db';
import { ProjectRepository, CardRepository } from '../../src/repositories';

describe('project and card repositories', () => {
  it('creates a project and an initial New card with revision 1', async () => {
    const prisma = createTestPrisma();
    await resetDatabase(prisma);

    const project = await new ProjectRepository(prisma).create({
      name: 'agent-kanban',
      repoUrl: 'https://example.com/repo.git',
    });

    const card = await new CardRepository(prisma).create({
      projectId: project.id,
      title: 'Backend skeleton',
      descriptionMd: '# Backend skeleton',
    });

    expect(card.state).toBe('New');
    expect(card.revision).toBe(1);
  });
});
```

- [ ] **Step 2: Start PostgreSQL and run the failing test**

Run:

```bash
pnpm db:up
pnpm --filter @agent-kanban/api test -- --run apps/api/tests/integration/project-card-repository.test.ts
```

Expected: FAIL because the API package, Prisma schema, and repositories do not exist yet.

- [ ] **Step 3: Implement the API scaffold and schema**

Schema requirements:

- `projects`
- `collaborators`
- `cards`
- `comments`
- `comment_mentions`
- `events`

Repository requirements:

- create project
- create card with `revision = 1`
- fetch board-ready card summaries

Generate Prisma client as part of this step.

- [ ] **Step 4: Run migration and rerun the repository test**

Run:

```bash
pnpm --filter @agent-kanban/api prisma migrate dev --name init
pnpm --filter @agent-kanban/api test -- --run apps/api/tests/integration/project-card-repository.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat: add api schema and repositories"
```

### Task 6: Implement workflow routes and revision-safe card updates

**Files:**
- Modify: `apps/api/src/app.ts`
- Create: `apps/api/src/services/card-service.ts`
- Create: `apps/api/src/routes/projects.ts`
- Create: `apps/api/src/routes/cards.ts`
- Test: `apps/api/tests/integration/workflow-routes.test.ts`

- [ ] **Step 1: Write the failing workflow route tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';

describe('workflow routes', () => {
  it('returns claim_conflict when a Ready card is claimed twice', async () => {
    const app = await buildApp();
    const first = await app.inject({ method: 'POST', url: '/cards/card-1/set-state', payload: { to: 'In Progress', ownerId: 'agent-1' } });
    const second = await app.inject({ method: 'POST', url: '/cards/card-1/set-state', payload: { to: 'In Progress', ownerId: 'agent-2' } });

    expect(first.statusCode).toBe(200);
    expect(second.statusCode).toBe(409);
    expect(second.json().error.code).toBe('claim_conflict');
  });

  it('returns revision_conflict on stale markdown update', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/cards/card-1/update-markdown',
      payload: { revision: 1, descriptionMd: '# stale' },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json().error.code).toBe('revision_conflict');
  });
});
```

- [ ] **Step 2: Run the failing route tests**

Run: `pnpm --filter @agent-kanban/api test -- --run apps/api/tests/integration/workflow-routes.test.ts`
Expected: FAIL because the routes and service logic are missing.

- [ ] **Step 3: Implement the workflow routes and service layer**

Implement:

- `POST /projects`
- `GET /projects/:id/board`
- `GET /cards/:id`
- `POST /cards`
- `POST /cards/:id/assign-owner`
- `POST /cards/:id/set-state`
- `POST /cards/:id/update-markdown`
- `POST /cards/:id/append-summary`

Service rules:

- use `packages/domain` for transition checks
- use `packages/card-markdown` for summary validation
- emit stable HTTP error payloads with shared error codes

- [ ] **Step 4: Run the workflow integration tests**

Run: `pnpm --filter @agent-kanban/api test -- --run apps/api/tests/integration/workflow-routes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat: add workflow api routes"
```

### Task 7: Implement comments, mentions, inbox, and event logging

**Files:**
- Modify: `apps/api/src/services/card-service.ts`
- Create: `apps/api/src/services/comment-service.ts`
- Create: `apps/api/src/services/inbox-service.ts`
- Modify: `apps/api/src/routes/cards.ts`
- Create: `apps/api/src/routes/inbox.ts`
- Test: `apps/api/tests/integration/comment-inbox.test.ts`

- [ ] **Step 1: Write the failing comment and inbox tests**

```ts
import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app';

describe('comment and inbox routes', () => {
  it('creates mention-driven inbox items', async () => {
    const app = await buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/cards/card-1/comments',
      payload: { kind: 'question', bodyMd: '@human-song can you review this?' },
    });

    expect(response.statusCode).toBe(201);

    const inbox = await app.inject({ method: 'GET', url: '/inbox?actorId=human-song' });
    expect(inbox.json().items[0].status).toBe('open');
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run: `pnpm --filter @agent-kanban/api test -- --run apps/api/tests/integration/comment-inbox.test.ts`
Expected: FAIL because comment parsing and inbox routes are missing.

- [ ] **Step 3: Implement comment, mention, inbox, and event behavior**

Implement:

- `POST /cards/:id/comments`
- `GET /inbox`
- `POST /inbox/items/:id/set-status`
- mention parsing that resolves known collaborator handles
- event creation for comments, owner changes, state changes, markdown updates, and summaries

Keep nested comments out of scope.

- [ ] **Step 4: Run the comment and inbox tests**

Run: `pnpm --filter @agent-kanban/api test -- --run apps/api/tests/integration/comment-inbox.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/api
git commit -m "feat: add comments and inbox api"
```

## Chunk 3: CLI, Web UI, And Bootstrap

### Task 8: Implement the CLI against the real API

**Files:**
- Create: `apps/cli/package.json`
- Create: `apps/cli/tsconfig.json`
- Create: `apps/cli/src/index.ts`
- Create: `apps/cli/src/client.ts`
- Create: `apps/cli/src/commands/list.ts`
- Create: `apps/cli/src/commands/show.ts`
- Create: `apps/cli/src/commands/create.ts`
- Create: `apps/cli/src/commands/assign-owner.ts`
- Create: `apps/cli/src/commands/set-state.ts`
- Create: `apps/cli/src/commands/update-card.ts`
- Create: `apps/cli/src/commands/append-summary.ts`
- Create: `apps/cli/src/commands/comment.ts`
- Test: `apps/cli/tests/cli.test.ts`

- [ ] **Step 1: Write the failing CLI tests**

```ts
import { describe, expect, it } from 'vitest';
import { runCli } from './run-cli';

describe('cli', () => {
  it('prints machine-usable JSON for list', async () => {
    const result = await runCli(['list', '--json']);
    expect(result.exitCode).toBe(0);
    expect(JSON.parse(result.stdout)).toHaveProperty('cards');
  });

  it('surfaces stable error codes on failure', async () => {
    const result = await runCli(['set-state', '--id', 'missing', '--to', 'Done', '--json']);
    expect(result.exitCode).toBe(1);
    expect(JSON.parse(result.stderr).error.code).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the failing CLI tests**

Run: `pnpm --filter @agent-kanban/cli test`
Expected: FAIL because the CLI package does not exist yet.

- [ ] **Step 3: Implement the CLI**

Requirements:

- call only the API
- support markdown file input for `update-card` and `append-summary`
- support `--json` output for automation
- preserve stable API error codes in stderr output

- [ ] **Step 4: Run the CLI tests**

Run: `pnpm --filter @agent-kanban/cli test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/cli
git commit -m "feat: add agent cli"
```

### Task 9: Build the board and card detail web UI

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.mjs`
- Create: `apps/web/app/layout.tsx`
- Create: `apps/web/app/page.tsx`
- Create: `apps/web/app/projects/[projectId]/page.tsx`
- Create: `apps/web/app/cards/[cardId]/page.tsx`
- Create: `apps/web/components/board-column.tsx`
- Create: `apps/web/components/card-tile.tsx`
- Create: `apps/web/components/card-detail.tsx`
- Create: `apps/web/components/comment-list.tsx`
- Create: `apps/web/lib/api.ts`
- Test: `apps/web/tests/board-and-card.spec.ts`

- [ ] **Step 1: Write the failing board/detail smoke test**

```ts
import { test, expect } from '@playwright/test';

test('board and card detail render current process state', async ({ page }) => {
  await page.goto('/projects/project-1');
  await expect(page.getByText('Ready')).toBeVisible();
  await page.getByText('Backend skeleton').click();
  await expect(page.getByText('Final Summary')).toBeVisible();
});
```

- [ ] **Step 2: Add web dependencies and install Playwright browsers**

Run:

```bash
pnpm --filter @agent-kanban/web add next react react-dom
pnpm --filter @agent-kanban/web add -D @playwright/test
pnpm --filter @agent-kanban/web exec playwright install chromium
```

Expected:

- package installation succeeds
- Playwright downloads Chromium successfully

- [ ] **Step 3: Run the smoke test to verify it fails**

Run: `pnpm --filter @agent-kanban/web test:e2e -- --grep "board and card detail"`
Expected: FAIL because the web app and routes do not exist yet.

- [ ] **Step 4: Implement the board and card detail UI**

Requirements:

- board grouped by workflow state
- card tiles show id, title, owner, priority
- card detail shows rendered markdown, Final Summary, and comments
- use server-side fetches against the API for the first slice

- [ ] **Step 5: Run the board/detail smoke test**

Run: `pnpm --filter @agent-kanban/web test:e2e -- --grep "board and card detail"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/web
git commit -m "feat: add board and card detail ui"
```

### Task 10: Add inbox and review-oriented human actions to the web UI

**Files:**
- Create: `apps/web/app/inbox/page.tsx`
- Create: `apps/web/components/review-actions.tsx`
- Create: `apps/web/components/inbox-list.tsx`
- Modify: `apps/web/components/card-detail.tsx`
- Test: `apps/web/tests/inbox-and-review.spec.ts`

- [ ] **Step 1: Write the failing inbox/review smoke test**

```ts
import { test, expect } from '@playwright/test';

test('human can review or send back a card from the browser', async ({ page }) => {
  await page.goto('/cards/card-1');
  await page.getByRole('button', { name: 'Send Back To In Progress' }).click();
  await expect(page.getByText('In Progress')).toBeVisible();
});
```

- [ ] **Step 2: Run the smoke test to verify it fails**

Run: `pnpm --filter @agent-kanban/web test:e2e -- --grep "human can verify"`
Expected: FAIL because the inbox page and completion actions are missing.

- [ ] **Step 3: Implement inbox and completion actions**

Requirements:

- inbox page shows `open`, `acknowledged`, and `resolved` items for the current human actor
- card detail supports:
  - add comment
  - update priority
  - `New -> Ready`
  - `Ready -> In Progress`
  - `In Progress -> Done`
- block browser-side writes that are intentionally CLI-only

- [ ] **Step 4: Run the inbox and review smoke test**

Run: `pnpm --filter @agent-kanban/web test:e2e -- --grep "human can verify"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web
git commit -m "feat: add inbox and completion actions"
```

### Task 11: Implement bootstrap import and full-system verification

**Files:**
- Create: `scripts/backfill-initial-cards.ts`
- Create: `scripts/verify-vertical-slice.mjs`
- Modify: `bootstrap/initial-cards.md`

- [ ] **Step 1: Write the failing bootstrap importer test**

```ts
import { describe, expect, it } from 'vitest';
import { parseSeedCards } from '../../scripts/backfill-initial-cards';

describe('bootstrap importer', () => {
  it('parses initial seed cards from markdown', async () => {
    const cards = await parseSeedCards('bootstrap/initial-cards.md');
    expect(cards[0].title).toBe('Backend Skeleton');
    expect(cards).toHaveLength(7);
  });
});
```

- [ ] **Step 2: Run the failing importer test**

Run: `pnpm test -- --run bootstrap-importer`
Expected: FAIL because the importer does not exist yet.

- [ ] **Step 3: Implement the importer and verification script**

Importer requirements:

- parse each draft card from `bootstrap/initial-cards.md`
- create matching cards through the API
- record the seed source in event payload or card context
- add explicit historical/backfilled marking to `bootstrap/initial-cards.md` after a successful import

Verification script requirements:

- check tooling
- ensure PostgreSQL is running
- run shared package tests
- run API integration tests
- run CLI tests
- run web smoke tests

- [ ] **Step 4: Run the importer test and the full verification sequence**

Run:

```bash
pnpm db:up
pnpm test
node scripts/backfill-initial-cards.ts
node scripts/verify-vertical-slice.mjs
pnpm db:down
```

Expected:

- all test suites pass
- seed cards import into the running system
- verification script exits `0`

- [ ] **Step 5: Commit**

```bash
git add scripts bootstrap/initial-cards.md
git commit -m "feat: add bootstrap import and verification"
```

## Execution Notes

- Keep each task self-contained and passing before moving on.
- Do not skip the tooling check or Playwright browser install.
- If PostgreSQL tests fail, inspect the container with `docker compose logs postgres` and verify the connection string with `psql`.
- If a step reveals a missing prerequisite not captured here, update this plan before continuing.

## Ready Check

Execution should start only after these are true:

- `node scripts/check-tooling.mjs` passes
- `docker compose up -d postgres` works locally
- `pnpm install` has completed
- the first shared-package tests are green

Plan complete and saved to `docs/superpowers/plans/2026-04-04-local-first-mvp-vertical-slice.md`. Ready to execute?
