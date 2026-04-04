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
    priority: number | null;
    revision: number;
  }>(request);
  const response = await postApi(`/cards/${cardId}/set-priority`, {
    ...body,
    actorId,
  });

  return NextResponse.json(response.body, { status: response.status });
}
