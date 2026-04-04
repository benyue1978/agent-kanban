import { parseCommandArgs, requireStringFlag, resolveActorId, } from "./common.js";
export async function runCommentCommand({ args, client, env }) {
    const { values } = parseCommandArgs(args, {
        author: { type: "string" },
        body: { type: "string" },
        id: { type: "string" },
        json: { type: "boolean" },
        kind: { type: "string" },
    });
    return await client.addComment(requireStringFlag(values, "id"), {
        authorId: resolveActorId(values, env, "author") ?? requireStringFlag(values, "author"),
        body: requireStringFlag(values, "body"),
        kind: requireStringFlag(values, "kind"),
    });
}
