import type { Entry } from "@/lib/entries/actions";
import { deleteEntry } from "@/lib/entries/actions";
import { badgeClasses } from "@/lib/emotion-colors";
import DeleteButton from "./delete-button";

type EntryListProps = {
  entries: Entry[];
};

/** Supabase returns 1:1 joins as object {} or array [{}] depending on client. */
function getAnalysis(entry: Entry) {
  const a = entry.analysis;
  if (!a) return null;
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

function moodBadge(emotion: string | null | undefined) {
  if (!emotion) return null;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeClasses(emotion)}`}>
      {emotion}
    </span>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function EntryList({ entries }: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="mt-16 flex flex-col items-center text-center">
        <span className="text-5xl">📖</span>
        <h3 className="mt-4 text-lg font-medium text-zinc-300">
          No entries yet
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Your first journal entry will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <h2 className="text-lg font-semibold text-white mb-4">Your entries</h2>

      <div className="space-y-4">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="group rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
          >
            {/* Header: date + mood */}
            <div className="flex items-center justify-between mb-3">
              <time className="text-xs text-zinc-500">
                {formatDate(entry.created_at)}
              </time>
              <div className="flex items-center gap-2">
                {entry.status === "pending" && (
                  <span className="rounded-full bg-zinc-700/50 px-2 py-0.5 text-[10px] text-zinc-400 animate-pulse">
                    analyzing...
                  </span>
                )}
                {(() => {
                  const analysis = getAnalysis(entry);
                  const primary = analysis?.primary_emotion;
                  const tags = analysis?.emotion_tags ?? [];
                  // Filter out primary_emotion from tags to avoid duplicates
                  const secondary = tags.filter(
                    (t) => t.toLowerCase() !== primary?.toLowerCase()
                  );
                  return (
                    <>
                      {moodBadge(primary)}
                      {secondary.map((tag) => moodBadge(tag))}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Content */}
            <p className="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap">
              {entry.content.length > 300
                ? entry.content.slice(0, 300) + "…"
                : entry.content}
            </p>

            {/* Footer: summary + actions */}
            <div className="mt-3 flex items-center justify-between">
              {getAnalysis(entry)?.summary ? (
                <p className="text-xs italic text-zinc-500">
                  💡 {getAnalysis(entry)?.summary}
                </p>
              ) : (
                <span />
              )}
              <DeleteButton entryId={entry.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
