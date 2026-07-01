import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export default async function LifePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch user profile with deep understanding
  const serviceClient = createServiceClient();
  const { data: profile } = await serviceClient
    .from("profiles")
    .select("deep_understanding")
    .eq("id", user.id)
    .single();

  const understanding = profile?.deep_understanding as Record<string, unknown> | null;

  return (
    <div className="max-w-[720px] mx-auto space-y-8 md:space-y-10 py-4">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-zinc-800 dark:text-white">
          Who I Am
        </h1>
        <p className="text-sm text-zinc-400 dark:text-zinc-500 leading-relaxed">
          AI has been reading your journals and learning about you.
        </p>
      </div>

      {understanding && understanding.total_entries ? (
        <div className="space-y-6">
          {/* Based on N entries */}
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Based on {String(understanding.total_entries)} journal entries
          </p>

          {/* Personality */}
          {Array.isArray(understanding.personality_hints) &&
            (understanding.personality_hints as string[]).length > 0 && (
              <Section title="Personality" items={understanding.personality_hints as string[]} />
            )}

          {/* Themes */}
          {Array.isArray(understanding.recurring_themes) &&
            (understanding.recurring_themes as { theme: string; count: number }[]).length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
                  Themes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(understanding.recurring_themes as { theme: string; count: number }[]).map(
                    (t) => (
                      <span
                        key={t.theme}
                        className="rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 px-3 py-1.5 text-sm"
                      >
                        {t.theme}
                        <span className="ml-1 text-xs text-zinc-400">{t.count}</span>
                      </span>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Patterns */}
          {Array.isArray(understanding.emotional_patterns) &&
            (understanding.emotional_patterns as string[]).length > 0 && (
              <Section title="Emotional Patterns" items={understanding.emotional_patterns as string[]} />
            )}

          {/* Values */}
          {Array.isArray(understanding.core_values) &&
            (understanding.core_values as string[]).length > 0 && (
              <Section title="Core Values" items={understanding.core_values as string[]} />
            )}

          {/* Conflicts */}
          {Array.isArray(understanding.recurring_conflicts) &&
            (understanding.recurring_conflicts as string[]).length > 0 && (
              <Section title="Inner Conflicts" items={understanding.recurring_conflicts as string[]} />
            )}

          {/* Growth */}
          {Array.isArray(understanding.growth_history) &&
            (understanding.growth_history as string[]).length > 0 && (
              <Section title="Growth" items={understanding.growth_history as string[]} />
            )}
        </div>
      ) : (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">📖</p>
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            Write more journals and AI will begin to understand you.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed pl-4 border-l-2 border-slate-200 dark:border-zinc-700"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
