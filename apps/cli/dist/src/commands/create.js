import { defaultCardDescription, getOptionalStringFlag, parseCommandArgs, readTextFile, requireStringFlag, resolveActorId, resolveProjectId, } from "./common.js";
export async function runCreateCommand({ args, client, env }) {
    const { values } = parseCommandArgs(args, {
        actor: { type: "string" },
        "description-file": { type: "string" },
        json: { type: "boolean" },
        priority: { type: "string" },
        project: { type: "string" },
        title: { type: "string" },
    });
    const title = requireStringFlag(values, "title");
    const descriptionFile = getOptionalStringFlag(values, "description-file");
    const priorityValue = getOptionalStringFlag(values, "priority");
    const descriptionMd = descriptionFile === undefined
        ? defaultCardDescription(title)
        : await readTextFile(descriptionFile);
    return await client.createCard({
        actorId: resolveActorId(values, env),
        descriptionMd,
        priority: priorityValue === undefined ? undefined : Number.parseInt(priorityValue, 10),
        projectId: resolveProjectId(values, env),
        title,
    });
}
