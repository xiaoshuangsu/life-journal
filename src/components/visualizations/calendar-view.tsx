"use client";

import { useMemo, useState } from "react";
import type { Entry } from "@/lib/entries/actions";
import { cellBgStyle } from "@/lib/emotion-colors";
import YearView from "./year-view";
import MonthView from "./month-view";
import EntryPreview from "./entry-preview";

type CalendarViewProps = {
  entries: Entry[];
  onNavigateToEntry: (entryId: string) => void;
};

type ViewMode = "year" | "month";

/** Aggregate entries by date → most frequent specific emotion */
export type CalendarData = Map<
  string,
  {
    entryIds: string[];
    dominantEmotion: string | null; // most frequent emotion tag that day
  }
>;

export function aggregateEntries(entries: Entry[]): CalendarData {
  const map: CalendarData = new Map();
  for (const e of entries) {
    const d = e.entry_date ?? e.created_at.slice(0, 10);
    if (!map.has(d)) {
      map.set(d, { entryIds: [], dominantEmotion: null });
    }
    const rec = map.get(d)!;
    rec.entryIds.push(e.id);
  }
  // Find most frequent specific emotion per day
  for (const [, rec] of map) {
    const counts = new Map<string, number>();
    for (const eid of rec.entryIds) {
      const e = entries.find((x) => x.id === eid);
      const a = Array.isArray(e?.analysis) ? e?.analysis[0] : e?.analysis;
      for (const tag of a?.emotion_tags ?? []) {
        counts.set(tag.toLowerCase(), (counts.get(tag.toLowerCase()) ?? 0) + 1);
      }
    }
    let best = null;
    let bestCount = 0;
    for (const [tag, count] of counts) {
      if (count > bestCount) { best = tag; bestCount = count; }
    }
    rec.dominantEmotion = best;
  }
  return map;
}

/** Calendar cell background as inline style (bypasses Tailwind JIT limitation) */
export function moodCellStyle(emotion: string | null): React.CSSProperties {
  return emotion ? cellBgStyle(emotion) : {};
}

export default function CalendarView({
  entries,
  onNavigateToEntry,
}: CalendarViewProps) {
  const [view, setView] = useState<ViewMode>("year");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const data = useMemo(() => aggregateEntries(entries), [entries]);

  const totalEntries = entries.length;
  const daysJournaled = data.size;

  // Get selected date's entries for preview
  const selectedEntryIds = selectedDate
    ? data.get(selectedDate)?.entryIds ?? []
    : [];
  const selectedEntries = entries.filter((e) =>
    selectedEntryIds.includes(e.id)
  );
  const selectedEmotion = selectedDate
    ? data.get(selectedDate)?.dominantEmotion ?? null
    : null;

  return (
    <div className="space-y-5">
      {/* Tab bar + Stats */}
      <div className="flex flex-col items-center gap-3">
        {/* Capsule tabs */}
        <div className="flex rounded-full bg-zinc-100 dark:bg-zinc-800 p-0.5">
          {(["year", "month"] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => {
                setView(v);
                setSelectedDate(null);
              }}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-all ${
                view === v
                  ? "bg-white dark:bg-zinc-700 text-zinc-800 dark:text-white shadow-sm"
                  : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {v === "year" ? "Year View" : "Month View"}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400 dark:text-zinc-500">Total Entries</span>
            <span className="text-xl font-bold text-white font-mono tabular-nums">
              {totalEntries}
            </span>
          </div>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400 dark:text-zinc-500">Days Journaled</span>
            <span className="text-xl font-bold text-white font-mono tabular-nums">
              {daysJournaled}
            </span>
          </div>
        </div>
      </div>

      {/* View */}
      {view === "year" ? (
        <YearView
          data={data}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      ) : (
        <MonthView
          data={data}
          entries={entries}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />
      )}

      {/* Entry preview on date click */}
      {selectedDate && selectedEntries.length > 0 && (
        <EntryPreview
          date={selectedDate}
          entries={selectedEntries}
          dominantEmotion={selectedEmotion}
          onViewEntry={(id) => onNavigateToEntry(id)}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </div>
  );
}
