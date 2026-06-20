import { notFound } from "next/navigation";
import { MatchView } from "@/components/match-view";
import { buildMatchState } from "@/lib/match/build-match-state";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const state = await buildMatchState(id);
  if (!state) notFound();

  return <MatchView matchId={id} initialState={state} />;
}
