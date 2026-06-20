import { CreateMatchForm } from "@/components/create-match-form";

export default function NewMatchPage() {
  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">New T20 Match</h1>
      <CreateMatchForm />
    </main>
  );
}
