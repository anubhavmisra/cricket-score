import { CreateMatchForm } from "@/components/create-match-form";
import { pageShell, pageTitle } from "@/lib/ui/styles";

export default function NewMatchPage() {
  return (
    <main className={pageShell}>
      <h1 className={`${pageTitle} mb-4`}>New T20 match</h1>
      <CreateMatchForm />
    </main>
  );
}
