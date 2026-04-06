# Operations Guide

This document covers operational tasks for the `agent-kanban` system.

## Database Management

### 1. Initial Seeding

The system automatically ensures that default collaborators (`agent` and `human`) exist in the database upon every startup of the API container.

If you need to run the seeding process manually:

**Production-like environment:**
```bash
pnpm db:seed
```

**Development environment:**
```bash
pnpm db:seed:dev
```

The seeding process is **idempotent and additive**. It uses Prisma `upsert` to create missing records without modifying existing data.

### 2. Backups

The system provides a built-in script to automate backups of the production database. This script handles timestamping and stores the SQL dump in the `backups/` directory.

To perform an ad-hoc backup:

```bash
pnpm db:backup
```

For manual control, you can still use the underlying docker command:

```bash
docker exec agent-kanban-prod-postgres-1 pg_dump -U agent_kanban -d agent_kanban > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 3. Scheduling Backups (Cron)

To schedule regular backups, you can use `cron` on the host machine. 

**Example: Every day at 3:00 AM**

Open your crontab:
```bash
crontab -e
```

Add the following entry (adjust path to your repo):
```cron
0 3 * * * cd /path/to/agent-kanban && /usr/local/bin/pnpm db:backup >> /var/log/agent-kanban-backup.log 2>&1
```

### 4. Restoration

To restore a backup into the production environment:

> **WARNING:** This will overwrite existing data.

```bash
cat your_backup_file.sql | docker exec -i agent-kanban-prod-postgres-1 psql -U agent_kanban -d agent_kanban
```

To safely test a restoration in the **dev environment**:

```bash
cat your_backup_file.sql | docker exec -i agent-kanban-dev-postgres-1 psql -U agent_kanban -d agent_kanban_dev
```

## Environment Isolation

- **Production (Default)**: Port 3001 (API), Port 3000 (Web), Port 5433 (DB).
- **Development**: Port 3101 (API), Port 3100 (Web), Port 5434 (DB).

Always use the provided `pnpm` scripts (`db:up:dev`, `start:dev`, `test`) to ensure you are targeting the correct environment.
