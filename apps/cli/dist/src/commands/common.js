import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
export function parseCommandArgs(args, options) {
    return parseArgs({
        args,
        allowPositionals: false,
        strict: true,
        options,
    });
}
export function requireStringFlag(values, name) {
    const value = values[name];
    if (typeof value !== "string" || value.length === 0) {
        throw new Error(`missing required flag --${name}`);
    }
    return value;
}
export function getOptionalStringFlag(values, name) {
    const value = values[name];
    return typeof value === "string" && value.length > 0 ? value : undefined;
}
export function getOptionalBooleanFlag(values, name) {
    return values[name] === true;
}
export function resolveProjectId(values, env) {
    return getOptionalStringFlag(values, "project") ?? env.projectId ?? fail("missing project id");
}
export function resolveActorId(values, env, flagName = "actor") {
    return getOptionalStringFlag(values, flagName) ?? env.actorId;
}
export async function readTextFile(path) {
    return await readFile(path, "utf8");
}
export function defaultCardDescription(title) {
    return `# ${title}

## Goal
TBD

## Scope
TBD

## Definition of Done
- [ ] implementation complete
- [ ] tests added`;
}
export function fail(message) {
    throw new Error(message);
}
