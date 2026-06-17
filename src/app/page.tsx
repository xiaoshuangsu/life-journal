import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <h1 className="mb-4 text-5xl font-bold tracking-tight text-white">
        Life Journal
      </h1>
      <p className="mb-2 max-w-md text-lg text-zinc-400">
        Your AI-powered personal memory and emotion insight system.
      </p>
      <p className="mb-8 max-w-md text-sm text-zinc-500">
        Write. Reflect. Understand your emotional patterns over time.
      </p>

      <div className="flex gap-4">
        <Link
          href="/signup"
          className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-zinc-700 px-6 py-2.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
