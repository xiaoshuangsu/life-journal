"use client";

import { useState, useMemo } from "react";
import { type CalendarData, moodCellStyle } from "./calendar-view";
import type { Entry } from "@/lib/entries/actions";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type MonthViewProps = {
  data: CalendarData;
  entries: Entry[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export default function MonthView({
  data,
  entries,
  selectedDate,
  onSelectDate,
}: MonthViewProps) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }
  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }
  function goToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  }

  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // Month stats
  const monthStats = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    const monthEntries = entries.filter(
      (e) => (e.entry_date ?? e.created_at.slice(0, 10)).startsWith(prefix)
    );
    const scored = monthEntries.filter((e) => e.mood_score != null);

    const positive = scored.filter((e) => e.mood_score! >= 0.2).length;
    const neutral = scored.filter(
      (e) => e.mood_score! > -0.2 && e.mood_score! < 0.2
    ).length;
    const negative = scored.filter((e) => e.mood_score! <= -0.2).length;

    // Count emotions
    const emotionCounts = new Map<string, number>();
    for (const e of monthEntries) {
      const a = Array.isArray(e.analysis) ? e.analysis[0] : e.analysis;
      for (const tag of a?.emotion_tags ?? []) {
        emotionCounts.set(tag, (emotionCounts.get(tag) ?? 0) + 1);
      }
    }
    const topEmotions = [...emotionCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const daysInData = new Set(
      monthEntries.map((e) => e.entry_date ?? e.created_at.slice(0, 10))
    ).size;

    return {
      total: monthEntries.length,
      days: daysInData,
      positive,
      neutral,
      negative,
      topEmotions,
    };
  }, [entries, viewYear, viewMonth]);

  return (
    <div className="flex gap-6">
      {/* Calendar grid */}
      <div className="flex-1">
        {/* Month nav */}
        <div className="flex items-center justify-center gap-4 mb-5">
          <button
            onClick={prevMonth}
            className="rounded-full p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
          <span className="text-lg font-semibold text-zinc-800 dark:text-white w-52 text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            className="rounded-full p-1 text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16">
              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 border border-slate-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_HEADERS.map((dh) => (
            <span
              key={dh}
              className="text-center text-[11px] font-medium text-zinc-400 dark:text-zinc-600 py-1"
            >
              {dh}
            </span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, di) => {
            if (day === null) {
              return <div key={`e-${di}`} className="aspect-square rounded-lg" />;
            }

            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const rec = data.get(dateStr);
            const isToday =
              viewYear === today.getFullYear() &&
              viewMonth === today.getMonth() &&
              day === today.getDate();
            const isSelected = dateStr === selectedDate;

            return (
              <button
                key={dateStr}
                onClick={() => rec && onSelectDate(dateStr)}
                disabled={!rec}
                style={rec ? moodCellStyle(rec.dominantEmotion) : undefined}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-colors relative text-white/80 ${
                  rec
                    ? "cursor-pointer hover:ring-1 hover:ring-zinc-400"
                    : "text-zinc-600 cursor-default bg-slate-200/50 dark:bg-zinc-800/30"
                } ${
                  isToday
                    ? "ring-1 ring-inset ring-zinc-800 dark:ring-zinc-400"
                    : ""
                } ${
                  isSelected
                    ? "ring-2 ring-inset ring-zinc-800 dark:ring-white"
                    : ""
                }`}
              >
                {day}
                {rec && (
                  <span className="absolute bottom-1 right-1.5 h-1.5 w-1.5 rounded-full bg-white/40" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Month Stats panel */}
      <div className="w-56 shrink-0 space-y-4">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4">
          <h4 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">
            Month Stats
          </h4>

          {/* Mood distribution */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Positive</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {monthStats.positive}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{
                  width: `${monthStats.total > 0 ? (monthStats.positive / monthStats.total) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Neutral</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {monthStats.neutral}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-400"
                style={{
                  width: `${monthStats.total > 0 ? (monthStats.neutral / monthStats.total) * 100 : 0}%`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-500">Low</span>
              <span className="font-mono text-zinc-700 dark:text-zinc-300">
                {monthStats.negative}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400"
                style={{
                  width: `${monthStats.total > 0 ? (monthStats.negative / monthStats.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
            <p className="text-[10px] text-zinc-400 mb-1.5">Days journaled</p>
            <p className="text-lg font-mono font-semibold text-zinc-800 dark:text-zinc-200">
              {monthStats.days}
              <span className="text-sm font-normal text-zinc-400">
                {" "}/ {daysInMonth}
              </span>
            </p>
          </div>
        </div>

        {/* Top emotions */}
        {monthStats.topEmotions.length > 0 && (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4">
            <h4 className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
              Top Emotions
            </h4>
            <div className="space-y-1">
              {monthStats.topEmotions.map(([emotion, count]) => (
                <div
                  key={emotion}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="text-zinc-600 dark:text-zinc-400">
                    {emotion}
                  </span>
                  <span className="font-mono text-zinc-400">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
