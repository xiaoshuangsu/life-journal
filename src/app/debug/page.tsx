import { cookies } from "next/headers";

export default async function DebugPage() {
  const cookieStore = await cookies();
  const all = cookieStore.getAll();

  return (
    <div className="min-h-screen bg-zinc-950 p-8 text-white">
      <h1 className="text-xl font-bold mb-4">Cookies</h1>
      <pre className="text-xs text-zinc-400">
        {JSON.stringify(all, null, 2)}
      </pre>

      <h2 className="text-lg font-bold mt-6 mb-2">Env Vars</h2>
      <pre className="text-xs text-zinc-400">
        {JSON.stringify(
          {
            SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓" : "✗",
            SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓" : "✗",
            SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓" : "✗",
            DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? "✓" : "✗",
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}
