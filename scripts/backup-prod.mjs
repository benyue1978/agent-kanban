#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BACKUP_DIR = "backups";
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, "-");
const FILENAME = `backup_${TIMESTAMP}.sql`;
const DEST = path.join(BACKUP_DIR, FILENAME);

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

console.log(`Creating backup: ${DEST}...`);

// Use docker compose to find the container and run pg_dump
// We use 'prod' stack as the default for this script
const result = spawnSync(
  "node",
  [
    "scripts/compose-stack.mjs",
    "prod",
    "exec",
    "-T",
    "postgres",
    "pg_dump",
    "-U",
    process.env.POSTGRES_USER || "agent_kanban",
    "-d",
    process.env.POSTGRES_DB || "agent_kanban",
  ],
  {
    stdio: ["ignore", "pipe", "inherit"],
    shell: false,
  }
);

if (result.status !== 0) {
  console.error("Backup failed!");
  process.exit(result.status ?? 1);
}

fs.writeFileSync(DEST, result.stdout);

console.log(`Backup completed successfully: ${DEST}`);
console.log(`Size: ${(result.stdout.length / 1024 / 1024).toFixed(2)} MB`);
