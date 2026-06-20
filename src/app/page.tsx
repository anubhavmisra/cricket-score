import Link from "next/link";
import { MatchList } from "@/components/match-list";
import { listMatches } from "@/lib/match/list-matches";
import { btnPrimary, pageShell, sectionTitle } from "@/lib/ui/styles";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const matches = await listMatches();

  return (
    <main className={`${pageShell} flex flex-col gap-6 py-6`}>
      <header className="flex flex-col gap-2 text-center">
        <p className="text-pretty text-muted">
          Score T20 matches on the field. Share a link. Everyone watches live.
        </p>
      </header>

      <Link
        href="/matches/new"
        className={`${btnPrimary} inline-flex w-full items-center justify-center no-underline`}
      >
        New T20 match
      </Link>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Your matches</h2>
        <MatchList matches={matches} />
      </section>
    </main>
  );
}
