import companies from "@/data/companies.json";

const endpoints = [
  { label: "Leaderboard", path: "/api/leaderboard" },
  { label: "Start score job", path: "/api/score" },
  { label: "Agent-readable summary", path: "/llms.txt" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">
            AgentReady
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">
            Documentation readiness scoring for AI agents.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-neutral-300">
            The backend is wired for AFDocs scans, Supabase storage, job polling,
            and an Indian company leaderboard seed set.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-sm text-neutral-400">Seed companies</p>
            <p className="mt-2 text-3xl font-semibold">{companies.length}</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-sm text-neutral-400">Scoring engine</p>
            <p className="mt-2 text-3xl font-semibold">AFDocs</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-900 p-5">
            <p className="text-sm text-neutral-400">Storage</p>
            <p className="mt-2 text-3xl font-semibold">Supabase</p>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-800 bg-neutral-900">
          <div className="border-b border-neutral-800 px-5 py-4">
            <h2 className="text-lg font-medium">Available backend routes</h2>
          </div>
          <div className="divide-y divide-neutral-800">
            {endpoints.map((endpoint) => (
              <div
                className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                key={endpoint.path}
              >
                <span className="text-neutral-300">{endpoint.label}</span>
                <code className="text-sm text-emerald-300">{endpoint.path}</code>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

