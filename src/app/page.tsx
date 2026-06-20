import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Cricket Score</h1>
      <p className="text-center text-gray-600">Score T20 matches on the field. Share a link. Everyone watches live.</p>
      <Link
        href="/matches/new"
        className="rounded-xl bg-green-600 px-8 py-4 text-lg font-semibold text-white"
      >
        New T20 Match
      </Link>
    </main>
  );
}
