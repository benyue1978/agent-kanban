# Source of Truth Model

## Problem

The phrase "repo is the source of truth" is too broad and can cause confusion.

Different parts of the system have different types of truth.

## Truth Layers

### 1. Code and Artifact Truth

Stored in:

- Git repository

Includes:

- source code
- tests
- design documents
- generated artifacts

This is the authoritative truth for implementation.

### 2. Task Process Truth

Stored in:

- Kanban system

Includes:

- card state
- ownership
- comments
- event history

This is the authoritative truth for process and progress.

### 3. Planning Truth (Pre-MVP)

Before the system exists:

- planning lives in repo markdown documents

After MVP:

- active planning moves into the Kanban system

Repo planning docs become reference material rather than the active task system.

## Conflict Resolution

### Code vs Card

- code in repo wins for implementation truth
- card summary should reflect repo, not override it

### Planning vs Execution

- planning sections in card may drift
- Final Summary is authoritative for the result

## Post-Backfill Policy

Once draft planning cards have been backfilled into the system:

- repo planning docs used for bootstrap should no longer be treated as active task-management documents
- active task state should live in the Kanban system
- bootstrap seed docs may remain in the repo as historical or reference material
- if retained, they should be clearly marked as backfilled or historical

## Seed doc marking convention

V1 should use a simple explicit marking convention for retained bootstrap seed docs.

Recommended options:

- front matter such as `status: backfilled`
- dedicated directory such as `bootstrap/` or `docs/bootstrap-seed/`
- filename convention indicating historical seed status

The important point is that retained seed docs must not look like active planning trackers.

## Why this matters

Without this separation:

- agents may trust outdated card content
- humans may trust outdated repo planning docs
- system consistency becomes unclear

## Guiding Principle

- repo answers: "what was built"
- kanban answers: "what is happening"

Both are necessary and complementary.
