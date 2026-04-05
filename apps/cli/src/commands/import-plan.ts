import type { CommandContext } from "./common.js";
import {
  getOptionalStringFlag,
  parseCommandArgs,
  readTextFile,
  resolveActorId,
  resolveProjectId,
} from "./common.js";
import { parsePlanTasks } from "../plan-import.js";

export async function runImportPlanCommand({ args, client, env }: CommandContext) {
  const { values } = parseCommandArgs(args, {
    actor: { type: "string" },
    json: { type: "boolean" },
    "plan-file": { type: "string" },
    project: { type: "string" },
    "spec-file": { type: "string" },
  });

  const planPath = getOptionalStringFlag(values, "plan-file");

  if (planPath === undefined) {
    throw new Error("missing required flag --plan-file");
  }

  const specPath = getOptionalStringFlag(values, "spec-file");
  const tasks = parsePlanTasks({
    planMarkdown: await readTextFile(planPath),
    planPath,
    ...(specPath === undefined ? {} : { specPath }),
  });

  return await client.importPlan(resolveProjectId(values, env), {
    actorId: resolveActorId(values, env),
    tasks,
  });
}
