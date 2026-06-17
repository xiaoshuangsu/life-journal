"use client";

import type { Entry } from "@/lib/entries/actions";

type CalendarHeatmapProps = {
  entries: Entry[];
};

type DayCell = {
  date: string;
  score: number | null; // null = no entry that day
  count: number; // number of entries that day
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];

function scoreColor(score: number | null): string {
  if (score === null) return "bg-zinc-800/50"; // no entry
  if (score >= 0.5) return "bg-emerald-600";
  if (score >= 0.2) return "bg-emerald-700/80";
  if (score > -0.2) return "bg-zinc-600";
  if (score > -0.5) return "bg-orange-700/80";
  if (score > -0.8) return "bg-orange-600";
  return "bg-red-600";
}

function buildGrid(entries: Entry[]): DayCell[] {
  const now = new Date();
  const year = now.getFullYear();

  // Start from Jan 1 of current year
  const start = new Date(year, 0, 1);

  // Build lookup: dateStr → { score, count }
  const lookup: Record<string, { total: number; count: number }> = {};
  for (const e of entries) {
    const d = e.entry_date ?? e.created_at.slice(0, 10);
    if (!lookup[d]) lookup[d] = { total: 0, count: 0 };
    lookup[d].total += e.mood_score ?? 0;
    lookup[d].count += 1;
  }

  // Generate all days from Jan 1 to today
  const days: DayCell[] = [];
  const d = new Date(start);
  const today = new Date(year, now.getMonth(), now.getDate());

  while (d <= today) {
    const key = d.toISOString().slice(0, 10);
    const rec = lookup[key];
    days.push({
      date: key,
      score: rec ? rec.total / rec.count : null,
      count: rec?.count ?? 0,
    });
    d.setDate(d.getDate() + 1);
  }

  return days;
}

export default function CalendarHeatmap({ entries }: CalendarHeatmapProps) {
  const days = buildGrid(entries);
  if (days.length === 0) return null;

  // Pad start so the first day aligns with the correct weekday
  const firstDay = new Date(days[0].date);
  const padStart = (firstDay.getDay() + 6) % 7; // Monday=0
  const padded = [...Array(padStart).fill(null), ...days];

  const weeks: (DayCell | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Figure out which months to label
  const monthLabels: { label: string; col: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const cell = week.find((c) => c !== null);
    if (!cell) return;
    const m = new Date(cell.date).getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ label: MONTHS[m], col: wi });
      lastMonth = m;
    }
  });

  const daysWithData = days.filter((d) => d.score !== null).length;
  const avgMood =
    daysWithData > 0
      ? days
          .filter((d) => d.score !== null)
          .reduce((s, d) => s + d.score!, 0) / daysWithData
      : 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          {new Date().getFullYear()} Mood Calendar
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span>{daysWithData} days recorded</span>
          <span>·</span>
          <span>avg mood {avgMood.toFixed(2)}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-[10px] text-zinc-500 mr-1">Low</span>
        {[-1, -0.6, -0.2, 0.2, 0.6, 1].map((s) => (
          <div
            key={s}
            className={`h-3 w-3 rounded-sm ${scoreColor(s)}`}
            title={String(s)}
          />
        ))}
        <span className="text-[10px] text-zinc-500 ml-1">High</span>
      </div>

      {/* Month labels */}
      <div className="flex mb-1 ml-8">
        {monthLabels.map((m) => (
          <div
            key={m.label}
            className="text-[10px] text-zinc-500"
            style={{
              position: "relative",
              left: `${m.col * 14}px`,
              marginRight: "12px",
            }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Grid: day labels + cells */}
      <div className="flex gap-0.5">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-0.5 mr-1.5">
          {DAYS.map((label, i) => (
            <div
              key={i}
              className="flex h-3 w-7 items-center text-[9px] text-zinc-600"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="flex gap-0.5 overflow-x-auto pb-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((cell, di) => (
                <div
                  key={di}
                  title={
                    cell
                      ? `${cell.date} · ${
                          cell.score !== null
                            ? `mood ${cell.score.toFixed(2)}`
                            : "no entry"
                        }`
                      : ""
                  }
                  className={`h-3 w-3 rounded-sm ${scoreColor(cell?.score ?? null)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
