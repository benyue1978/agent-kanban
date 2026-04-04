import { NextResponse } from "next/server";
import { postApi } from "@/lib/api";

async function readBody<T>(request: Request): Promise<T> {
  const text = await request.text();
  return (text.length === 0 ? {} : JSON.parse(text)) as T;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { itemId } = await params;
  const body = await readBody<{
    status: string;
  }>(request);
  const response = await postApi(
    `/inbox/items/${encodeURIComponent(itemId)}/set-status`,
    body
  );

  return NextResponse.json(response.body, { status: response.status });
}
