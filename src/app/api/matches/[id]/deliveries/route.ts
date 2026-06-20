import { NextResponse } from "next/server";
import { z } from "zod";
import { requireMatchOwner } from "@/lib/auth/match-access";
import { deliveryPayloadSchema, insertDeliveriesBatch } from "@/lib/match/insert-deliveries";

const batchSchema = z.object({ deliveries: z.array(deliveryPayloadSchema).min(1) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const access = await requireMatchOwner(id);
  if ("error" in access) return access.error;

  const body = batchSchema.safeParse(await request.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.flatten() }, { status: 400 });
  }

  const result = await insertDeliveriesBatch(id, body.data.deliveries);
  return NextResponse.json({ inserted: result.length });
}
