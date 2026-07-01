"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import MultiSelect from "@/components/multi-select";
import JournalList from "@/components/journal-list";
import type { Entry } from "@/lib/entries/actions";

const EntryDetail = dynamic(
  () => import("@/app/dashboard/detail"),
  { ssr: false }
);

function collectFacets(entries: Entry[]) {
  const emotions = new Map<string, number>();
  const topics = new Map<string, number>();
  for (const e of entries) {
    const a = Array.isArray(e.analysis) ? e.analysis[0] : e.analysis;
    for (const tag of a?.emotion_tags ?? []) {
      emotions.set(tag, (emotions.get(tag) ?? 0) + 1);
    }
    for (const t of a?.topics ?? []) {
      topics.set(t, (topics.get(t) ?? 0) + 1);
    }
  }
  return {
    emotions: [...emotions.entries()].sort((a, b) => b[1] - a[1]).map(([v, c]) => ({ value: v, count: c })),
    topics: [...topics.entries()].sort((a, b) => b[1] - a[1]).map(([v, c]) => ({ value: v, count: c })),
  };
}

export default function JournalContent({
  initialEntries,
}: {
  initialEntries: Entry[];
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [search, setSearch] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<Set<string>>(new Set());
  const [topicFilter, setTopicFilter] = useState<Set<string>>(new Set());
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  const facets = useMemo(() => collectFacets(entries), [entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !entry.title?.toLowerCase().includes(q) &&
          !entry.content.toLowerCase().includes(q)
        )
          return false;
      }
      if (emotionFilter.size > 0) {
        const a = Array.isArray(entry.analysis) ? entry.analysis[0] : entry.analysis;
        const tags = a?.emotion_tags ?? [];
        if (!tags.some((t) => emotionFilter.has(t))) return false;
      }
      if (topicFilter.size > 0) {
        const a = Array.isArray(entry.analysis) ? entry.analysis[0] : entry.analysis;
        const kws = a?.topics ?? [];
        if (!kws.some((k) => topicFilter.has(k))) return false;
      }
      return true;
    });
  }, [entries, search, emotionFilter, topicFilter]);

  function handleUpdated(updated: Entry) {
    setEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    setSelectedEntry(updated);
  }

  function handleDeleted(deletedId: string) {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    setView("list");
  }

  if (view === "detail" && selectedEntry) {
    return (
      <div className="max-w-[720px] mx-auto">
        <button
          onClick={() => setView("list")}
          className="text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white mb-4 transition-colors"
        >
          ← Back
        </button>
        <EntryDetail
          entry={selectedEntry}
          onDeleted={() => handleDeleted(selectedEntry.id)}
          onUpdated={handleUpdated}
          onNewEntry={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto space-y-4">
      {/* Search + filters */}
      <div className="space-y-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entries..."
          className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 px-4 py-2 text-sm text-zinc-800 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
        />
        {facets.emotions.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            <MultiSelect
              label="Emotion"
              options={facets.emotions}
              selected={emotionFilter}
              onChange={(v) =>
                setEmotionFilter((prev) => {
                  const next = new Set(prev);
                  next.has(v) ? next.delete(v) : next.add(v);
                  return next;
                })
              }
            />
            <MultiSelect
              label="Topic"
              options={facets.topics}
              selected={topicFilter}
              onChange={(v) =>
                setTopicFilter((prev) => {
                  const next = new Set(prev);
                  next.has(v) ? next.delete(v) : next.add(v);
                  return next;
                })
              }
            />
          </div>
        )}
      </div>

      {/* Time-grouped list */}
      <JournalList entries={filtered} onSelect={(e) => { setSelectedEntry(e); setView("detail"); }} />
    </div>
  );
}
