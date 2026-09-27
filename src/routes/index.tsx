import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JTP" },
      { name: "description", content: "JTP" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground select-none">
      <h1 className="text-7xl sm:text-9xl font-extrabold tracking-widest text-foreground font-heading">
        JTP
      </h1>
    </main>
  );
}
