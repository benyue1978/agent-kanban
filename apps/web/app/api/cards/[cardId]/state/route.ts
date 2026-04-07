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

  let body: any;
  try {
    body = await request.json();
  } catch (err) {
    body = {};
  }

  const response = await postApi(`/cards/${cardId}/set-state`, {
    ...body,
    actorId,
  });

  return NextResponse.json(response.body, { status: response.status });
}
