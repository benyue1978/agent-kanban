import { parseCommandArgs, readTextFile, requireStringFlag, resolveActorId, } from "./common.js";
export async function runUpdateCardCommand({ args, client, env }) {
    const { values } = parseCommandArgs(args, {
        actor: { type: "string" },
        file: { type: "string" },
        id: { type: "string" },
        json: { type: "boolean" },
        revision: { type: "string" },
    });
    const cardId = requireStringFlag(values, "id");
    const revisionValue = requireStringFlag(values, "revision");
    const descriptionMd = await readTextFile(requireStringFlag(values, "file"));
    return await client.updateMarkdown(cardId, {
        actorId: resolveActorId(values, env),
        descriptionMd,
        revision: Number.parseInt(revisionValue, 10),
    });
}
