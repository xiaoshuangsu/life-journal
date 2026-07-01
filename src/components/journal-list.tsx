"use client";

import { useMemo } from "react";
import EmotionAvatar from "@/components/emotion-avatar";
import { badgeStyle} from "@/lib/emotion-colors";
import type { Entry } from "@/lib/entries/actions";

type JournalListProps = {
  entries: Entry[];
  onSelect: (entry: Entry) => void;
};

function getAnalysis(entry: Entry) {
  const a = entry.analysis;
  if (!a) return null;
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

type Group = {
  label: string;
  entries: Entry[];
};

function groupByTime(entries: Entry[]): Group[] {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const groups: Group[] = [
    { label: "Today", entries: [] },
    { label: "Yesterday", entries: [] },
  ];

  const rest: Entry[] = [];
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const threeDaysStr = threeDaysAgo.toISOString().slice(0, 10);

  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekStr = lastWeek.toISOString().slice(0, 10);

  for (const e of entries) {
    const d = e.entry_date ?? e.created_at.slice(0, 10);
    if (d === today) {
      groups[0].entries.push(e);
    } else if (d === yesterdayStr) {
      groups[1].entries.push(e);
    } else {
      rest.push(e);
    }
  }

  // Sub-group rest
  const recent: Entry[] = [];
  const earlier: Entry[] = [];
  for (const e of rest) {
    const d = e.entry_date ?? e.created_at.slice(0, 10);
    if (d >= lastWeekStr) recent.push(e);
    else earlier.push(e);
  }

  if (recent.length > 0) groups.push({ label: "Last Week", entries: recent });
  if (earlier.length > 0) groups.push({ label: "Earlier", entries: earlier });

  return groups.filter((g) => g.entries.length > 0);
}

export default function JournalList({
  entries,
  onSelect,
}: JournalListProps) {
  const groups = useMemo(() => groupByTime(entries), [entries]);

  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No entries yet. Start your first journal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wide uppercase mb-2">
            {group.label}
          </p>
          <div className="space-y-2">
            {group.entries.map((entry) => {
              const analysis = getAnalysis(entry);
              const tags = analysis?.emotion_tags ?? [];
              const lifeThemes = analysis?.life_themes ?? [];
              const primaryEmotion = analysis?.primary_emotion;

              return (
                <button
                  key={entry.id}
                  onClick={() => onSelect(entry)}
                  className="w-full text-left rounded-2xl p-4 bg-white dark:bg-slate-900/40 border border-slate-200/60 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-x-2.5 mb-1.5">
                    <EmotionAvatar emotion={primaryEmotion} size={20} plain />
                    <h3 className="text-[15px] font-semibold text-zinc-800 dark:text-zinc-100 line-clamp-1">
                      {entry.title || "Untitled"}
                    </h3>
                  </div>
                  <p className="text-[13px] text-zinc-400 dark:text-zinc-500 line-clamp-2 ml-7">
                    {entry.content.slice(0, 100)}
                  </p>
                  <div className="flex flex-wrap items-center gap-1 mt-2 ml-7">
                    {tags.slice(0, 2).map((tag) => (
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
        </div>
      ))}
    </div>
  );
}
