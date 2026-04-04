import { CardState } from "@agent-kanban/contracts";
import { getCardRevision } from "../client.js";
import { getOptionalStringFlag, parseCommandArgs, requireStringFlag, resolveActorId, } from "./common.js";
export async function runSetStateCommand({ args, client, env }) {
    const { values } = parseCommandArgs(args, {
        actor: { type: "string" },
        id: { type: "string" },
        json: { type: "boolean" },
        owner: { type: "string" },
        to: { type: "string" },
    });
    const cardId = requireStringFlag(values, "id");
    const to = requireStringFlag(values, "to");
    const actorId = resolveActorId(values, env);
    const card = await client.getCard(cardId);
    const ownerId = to === CardState.InProgress
        ? getOptionalStringFlag(values, "owner") ?? actorId
        : undefined;
    return await client.setState(cardId, {
        actorId,
        ...(ownerId === undefined ? {} : { ownerId }),
        revision: getCardRevision(card.card),
        to,
    });
}
