"use client";

import { useMemo, useState } from "react";
import MultiSelect from "@/components/multi-select";
import { dotStyle } from "@/lib/emotion-colors";
import type { Entry } from "@/lib/entries/actions";

type EntrySidebarProps = {
  entries: Entry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

function getAnalysis(entry: Entry) {
  const a = entry.analysis;
  if (!a) return null;
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

function moodDot(emotion: string | null | undefined) {
  if (!emotion) return null;
  return (
    <span
      className="inline-block h-2 w-2 rounded-full shrink-0"
      style={dotStyle(emotion)}
    />
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

function collectFacets(entries: Entry[]) {
  const emotions = new Map<string, number>();
  const keywords = new Map<string, number>();

  for (const e of entries) {
    const a = getAnalysis(e);
    for (const tag of a?.emotion_tags ?? []) {
      emotions.set(tag, (emotions.get(tag) ?? 0) + 1);
    }
    for (const t of a?.topics ?? []) {
      keywords.set(t, (keywords.get(t) ?? 0) + 1);
    }
  }

  return {
    emotions: [...emotions.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count })),
    keywords: [...keywords.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count })),
  };
}

export default function EntrySidebar({
  entries,
  selectedId,
  onSelect,
}: EntrySidebarProps) {
  const [search, setSearch] = useState("");
  const [emotionFilter, setEmotionFilter] = useState<Set<string>>(new Set());
  const [keywordFilter, setKeywordFilter] = useState<Set<string>>(new Set());

  const facets = useMemo(() => collectFacets(entries), [entries]);

  const filtered = useMemo(() => {
    return entries.filter((entry) => {
      if (search) {
        const q = search.toLowerCase();
        const inTitle = entry.title?.toLowerCase().includes(q);
        const inContent = entry.content.toLowerCase().includes(q);
        if (!inTitle && !inContent) return false;
      }
      if (emotionFilter.size > 0) {
        const a = getAnalysis(entry);
        const tags = a?.emotion_tags ?? [];
        if (!tags.some((t) => emotionFilter.has(t))) return false;
      }
      if (keywordFilter.size > 0) {
        const a = getAnalysis(entry);
        const kws = a?.topics ?? [];
        if (!kws.some((k) => keywordFilter.has(k))) return false;
      }
      return true;
    });
  }, [entries, search, emotionFilter, keywordFilter]);

  function toggleEmotion(tag: string) {
    setEmotionFilter((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  function toggleKeyword(kw: string) {
    setKeywordFilter((prev) => {
      const next = new Set(prev);
      if (next.has(kw)) next.delete(kw);
      else next.add(kw);
      return next;
    });
  }

  const hasFilters = search || emotionFilter.size > 0 || keywordFilter.size > 0;

  return (
    <div className="h-full p-3">
    <nav className="flex flex-col h-full rounded-2xl bg-white dark:bg-slate-900/40 dark:backdrop-blur-md shadow-sm p-4">
      {/* Search */}
      <div className="px-3 mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search entries..."
          className="w-full rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 px-4 py-2 text-xs text-zinc-800 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
        />
      </div>

      {/* Emotion + Topic dropdowns — same row */}
      <div className="px-3 mb-2 grid grid-cols-2 gap-2 w-full">
        {facets.emotions.length > 0 && (
          <MultiSelect
            label="Emotion"
            options={facets.emotions}
            selected={emotionFilter}
            onChange={toggleEmotion}
          />
        )}
        {facets.keywords.length > 0 && (
          <MultiSelect
            label="Topic"
            options={facets.keywords}
            selected={keywordFilter}
            onChange={toggleKeyword}
          />
        )}
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <div className="px-3 mb-2">
          <button
            onClick={() => {
              setSearch("");
              setEmotionFilter(new Set());
              setKeywordFilter(new Set());
            }}
            className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="mx-3 border-t border-slate-200 dark:border-zinc-800 mb-2" />

      {/* Entry list */}
      {filtered.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-4">
          <p className="text-xs text-zinc-400 dark:text-zinc-600 text-center">
            {entries.length === 0
              ? "No entries yet."
              : "No entries match."}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-0.5 px-2">
          {filtered.map((entry) => {
            const analysis = getAnalysis(entry);
            const isSelected = entry.id === selectedId;

            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry.id)}
                className={`w-full text-left rounded-xl px-3 py-2.5 transition-all ${
                  isSelected
                    ? "bg-slate-100/80 dark:bg-white/10 shadow-sm ring-1 ring-slate-200 dark:ring-white/10"
                    : "hover:bg-slate-100 dark:hover:bg-zinc-800/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">
                    {formatDate(entry.created_at)}
                  </span>
                  {moodDot(analysis?.primary_emotion)}
                </div>
                <p className="text-[13px] font-medium text-zinc-700 dark:text-zinc-200 leading-tight line-clamp-2">
                  {entry.title
                    ? entry.title
                    : entry.content.slice(0, 40) + (entry.content.length > 40 ? "…" : "")}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-3 pt-2 border-t border-slate-200 dark:border-zinc-800">
        <p className="text-[10px] text-zinc-400 dark:text-zinc-600">
          {hasFilters
            ? `${filtered.length} of ${entries.length}`
            : `${entries.length} entr${entries.length === 1 ? "y" : "ies"}`}
        </p>
      </div>
    </nav>
    </div>
  );
}
