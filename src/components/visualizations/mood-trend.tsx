"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import type { Entry } from "@/lib/entries/actions";

type MoodTrendProps = {
  entries: Entry[];
};

type Range = 7 | 30 | 90;

export default function MoodTrend({ entries }: MoodTrendProps) {
  const [range, setRange] = useState<Range>(30);

  const data = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(start.getDate() - range + 1);
    start.setHours(0, 0, 0, 0);

    // Aggregate by date
    const map: Record<string, { total: number; count: number }> = {};
    for (const e of entries) {
      const d = e.entry_date ?? e.created_at.slice(0, 10);
      if (d < start.toISOString().slice(0, 10)) continue;
      if (!map[d]) map[d] = { total: 0, count: 0 };
      map[d].total += e.mood_score ?? 0;
      map[d].count += 1;
    }

    // Fill all days in range
    const result: { date: string; score: number | null; label: string }[] = [];
    const cursor = new Date(start);
    for (let i = 0; i < range; i++) {
      const key = cursor.toISOString().slice(0, 10);
      const rec = map[key];
      result.push({
        date: key,
        score: rec ? rec.total / rec.count : null,
        label: `${cursor.getMonth() + 1}/${cursor.getDate()}`,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [entries, range]);

  const stats = useMemo(() => {
    const scored = data.filter((d) => d.score !== null);
    if (scored.length === 0) return { avg: 0, high: 0, low: 0, days: 0 };
    const scores = scored.map((d) => d.score!);
    return {
      avg: scores.reduce((s, v) => s + v, 0) / scores.length,
      high: Math.max(...scores),
      low: Math.min(...scores),
      days: scored.length,
    };
  }, [data]);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-white">Mood Flow</h3>
        <div className="flex gap-1">
          {([7, 30, 90] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-2 text-[10px] text-zinc-500">
        <span>
          avg <span className="text-zinc-300">{stats.avg.toFixed(2)}</span>
        </span>
        <span>
          high <span className="text-emerald-400">{stats.high.toFixed(2)}</span>
        </span>
        <span>
          low <span className="text-red-400">{stats.low.toFixed(2)}</span>
        </span>
        <span>
          {stats.days}/{range} days
        </span>
      </div>

      {/* Chart */}
      <div className="h-48">
        {data.filter((d) => d.score !== null).length < 2 ? (
          <div className="flex h-full items-center justify-center text-sm text-zinc-500">
            Need at least 2 days with entries to show the trend.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <defs>
                <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                  <stop offset="50%" stopColor="#71717a" stopOpacity={0.05} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#27272a"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "#71717a" }}
                tickLine={false}
                axisLine={false}
                interval={range === 7 ? 0 : range === 30 ? 4 : 9}
              />
              <YAxis
                domain={[-1, 1]}
                ticks={[-1, -0.5, 0, 0.5, 1]}
                tick={{ fontSize: 9, fill: "#71717a" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) =>
                  v === 1 ? "😊" : v === -1 ? "😞" : v === 0 ? "—" : ""
                }
              />
              <Tooltip
                contentStyle={{
                  background: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e4e4e7",
                }}
                formatter={(_value: unknown) => [
                  Number(_value).toFixed(2),
                  "Mood",
                ]}
                labelFormatter={(label: unknown) => `Date: ${label}`}
              />
              <ReferenceLine
                y={0}
                stroke="#3f3f46"
                strokeDasharray="3 3"
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#a1a1aa"
                strokeWidth={1.5}
                fill="url(#moodGradient)"
                connectNulls
                dot={false}
                activeDot={{
                  r: 3,
                  fill: "#fff",
                  stroke: "#a1a1aa",
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
