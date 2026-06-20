import { NextResponse } from "next/server";
import { buildMatchState } from "@/lib/match/build-match-state";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const state = await buildMatchState(id);
  if (!state) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(state);
}
