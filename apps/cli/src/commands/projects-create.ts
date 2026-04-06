import { getCurrentRepoUrl, inferProjectNameFromRepoUrl, readProjectPolicyFile, type CommandContext } from "./common.js";

export async function runProjectsCreateCommand(options: any, { client }: CommandContext) {
  const repoUrl = options.repoUrl ?? await getCurrentRepoUrl();
  if (typeof repoUrl !== "string" || repoUrl.length === 0) {
    throw new Error("missing required flag --repo-url and could not infer from current repository");
  }

  const name = options.name ?? inferProjectNameFromRepoUrl(repoUrl);
  const description = options.description;
  const policy = await readProjectPolicyFile(options.policyFile);

  return await client.createProject({
    name,
    repoUrl,
    description,
    policy,
  });
}
