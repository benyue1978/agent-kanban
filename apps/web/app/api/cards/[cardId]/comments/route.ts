import { CommentKind } from "@agent-kanban/contracts";
import { NextResponse } from "next/server";
import { postApi } from "@/lib/api";
import { getHumanActorId, humanActorConfigurationMessage } from "@/lib/config";

async function readBody<T>(request: Request): Promise<T> {
  const text = await request.text();
  return (text.length === 0 ? {} : JSON.parse(text)) as T;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ cardId: string }> }
) {
  const { cardId } = await params;
  const actorId = getHumanActorId();

  if (actorId === null) {
    return NextResponse.json(
      {
        error: {
          code: "forbidden_action",
          message: humanActorConfigurationMessage,
        },
      },
      { status: 500 }
    );
  }

  const body = await readBody<{
    body: string;
    kind?: string;
  }>(request);
  const response = await postApi(`/cards/${cardId}/comments`, {
    authorId: actorId,
    body: body.body,
    kind: body.kind ?? CommentKind.Note,
  });

  return NextResponse.json(response.body, { status: response.status });
}
