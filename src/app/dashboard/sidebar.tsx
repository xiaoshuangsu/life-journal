"use client";

import { useMemo, useState } from "react";
import MultiSelect from "@/components/multi-select";
import EmotionAvatar from "@/components/emotion-avatar";
import { badgeStyle, getEmotionColor } from "@/lib/emotion-colors";
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
    <nav className="flex flex-col h-full rounded-2xl bg-[#FBF9F6]/50 dark:bg-slate-900/40 dark:backdrop-blur-md shadow-sm p-4">
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
        <div className="flex-1 overflow-y-auto px-2 pt-2 space-y-[18px]">
          {filtered.map((entry) => {
            const analysis = getAnalysis(entry);
            const isSelected = entry.id === selectedId;
            const primaryEmotion = analysis?.primary_emotion;
            const tags = analysis?.emotion_tags ?? [];
            const lifeThemes = analysis?.life_themes ?? [];

            return (
              <button
                key={entry.id}
                onClick={() => onSelect(entry.id)}
                className={`w-full text-left rounded-[20px] p-4 transition-all duration-300 ease-out border-2 relative bg-[#FBF9F6] dark:bg-slate-800/80 ${
                  isSelected
                    ? `shadow-[0_12px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_12px_30px_rgba(0,0,0,0.2)] -translate-y-0.5`
                    : "border-stone-300/40 dark:border-white/5 shadow-none translate-y-0"
                }`}
                style={
                  isSelected && primaryEmotion
                    ? { borderColor: `${getEmotionColor(primaryEmotion).hex}80` }
                    : undefined
                }
              >
                {/* Date */}
                <p className="text-xs font-medium tracking-wide text-stone-400 dark:text-stone-500 mb-1">
                  {formatDate(entry.created_at)}
                </p>

                {/* Title + inline emotion icon */}
                <div className="flex items-center gap-x-2.5 mb-1">
                  <EmotionAvatar emotion={primaryEmotion} size={20} plain />
                  <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-100 leading-snug line-clamp-1">
                    {entry.title
                      ? entry.title
                      : entry.content.slice(0, 40) + (entry.content.length > 40 ? "…" : "")}
                  </h3>
                </div>

                {/* Summary */}
                <p className="text-[12px] text-zinc-400 dark:text-zinc-500 leading-relaxed line-clamp-2 mb-2">
                  {entry.content.slice(0, 80)}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1">
                  {tags.slice(0, 1).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={badgeStyle(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                  {lifeThemes.slice(0, 1).map((theme) => (
                    <span
                      key={theme}
                      className="rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 px-2 py-0.5 text-[10px]"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
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
