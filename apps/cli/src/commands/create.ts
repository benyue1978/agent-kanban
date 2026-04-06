import { defaultCardDescription, readTextFile, resolveActorId, resolveProjectId, type CommandContext } from "./common.js";

export async function runCreateCommand(options: any, { client, env }: CommandContext) {
  const title = options.title;
  if (typeof title !== "string" || title.length === 0) {
    throw new Error("missing required flag --title");
  }

  const descriptionFile = options.descriptionFile;
  const priorityValue = options.priority;
  const descriptionMd =
    (typeof descriptionFile !== "string" || descriptionFile.length === 0)
      ? defaultCardDescription(title)
      : await readTextFile(descriptionFile);

  return await client.createCard({
    actorId: resolveActorId(options, env),
    descriptionMd,
    priority: priorityValue === undefined ? undefined : Number.parseInt(String(priorityValue), 10),
    projectId: await resolveProjectId(options, env, client),
    title,
  });
}
