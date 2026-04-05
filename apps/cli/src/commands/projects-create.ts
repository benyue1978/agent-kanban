import type { CommandContext } from "./common.js";
import {
  getCurrentRepoUrl,
  getOptionalStringFlag,
  inferProjectNameFromRepoUrl,
  parseCommandArgs,
  readProjectPolicyFile,
} from "./common.js";

export async function runProjectsCreateCommand({ args, client }: CommandContext) {
  const { values } = parseCommandArgs(args, {
    description: { type: "string" },
    json: { type: "boolean" },
    name: { type: "string" },
    "policy-file": { type: "string" },
    "repo-url": { type: "string" },
  });
  const repoUrl =
    getOptionalStringFlag(values, "repo-url") ??
    (await getCurrentRepoUrl()) ??
    (() => {
      throw new Error("missing required flag --repo-url and no git origin found");
    })();
  const name =
    getOptionalStringFlag(values, "name") ??
    inferProjectNameFromRepoUrl(repoUrl);

  return await client.createProject({
    description: getOptionalStringFlag(values, "description") ?? null,
    name,
    policy: await readProjectPolicyFile(getOptionalStringFlag(values, "policy-file")),
    repoUrl,
  });
}
