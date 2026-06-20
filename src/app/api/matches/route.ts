import { NextResponse } from "next/server";
import { createMatch, createMatchSchema } from "@/lib/match/create-match";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createMatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const result = await createMatch(parsed.data);
  return NextResponse.json(result, { status: 201 });
}
