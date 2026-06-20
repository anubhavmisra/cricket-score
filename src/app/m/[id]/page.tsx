import { MatchView } from "@/components/match-view";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatchView matchId={id} />;
}
