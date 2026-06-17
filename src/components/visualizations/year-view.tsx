"use client";

import { useState } from "react";
import { type CalendarData, moodCellStyle } from "./calendar-view";

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

type YearViewProps = {
  data: CalendarData;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export default function YearView({
  data,
  selectedDate,
  onSelectDate,
}: YearViewProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const currentYear = today.getFullYear();

  function prevYear() {
    setYear((y) => y - 1);
  }
  function nextYear() {
    setYear((y) => y + 1);
  }

  return (
    <div>
      {/* Year nav */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <button
          onClick={prevYear}
          className="rounded-full p-1 text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        <span className="text-lg font-semibold text-white w-20 text-center">
          {year}
        </span>
        <button
          onClick={nextYear}
          className="rounded-full p-1 text-zinc-500 hover:text-white transition-colors"
        >
          <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </button>
        {year !== currentYear && (
          <button
            onClick={() => setYear(currentYear)}
            className="rounded-full px-3 py-1 text-xs font-medium text-zinc-500 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            This Year
          </button>
        )}
      </div>

      {/* 12 months grid — 4 cols × 3 rows */}
      <div className="grid grid-cols-4 gap-4">
        {MONTH_NAMES.map((name, mi) => {
          const firstDay = new Date(year, mi, 1);
          const daysInMonth = new Date(year, mi + 1, 0).getDate();
          const startDow = firstDay.getDay(); // 0=Sun

          // Build cells: pad start with null
          const cells: (number | null)[] = [];
          for (let i = 0; i < startDow; i++) cells.push(null);
          for (let d = 1; d <= daysInMonth; d++) cells.push(d);

          return (
            <div key={name} className="rounded-lg p-2">
              <p className="text-xs font-semibold text-white mb-1.5 text-center">
                {name}
              </p>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-0.5">
                {DAY_HEADERS.map((dh) => (
                  <span
                    key={dh}
                    className="text-center text-[9px] text-zinc-400 dark:text-zinc-600"
                  >
                    {dh}
                  </span>
                ))}
              </div>

              {/* Cells */}
              <div className="grid grid-cols-7 gap-px">
                {cells.map((day, di) => {
                  if (day === null) {
                    return <div key={`e-${di}`} className="aspect-square" />;
                  }

                  const dateStr = `${year}-${String(mi + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const rec = data.get(dateStr);
                  const isToday =
                    year === today.getFullYear() &&
                    mi === today.getMonth() &&
                    day === today.getDate();
                  const isSelected = dateStr === selectedDate;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => rec && onSelectDate(dateStr)}
                      disabled={!rec}
                      style={rec ? moodCellStyle(rec.dominantEmotion) : undefined}
                      className={`aspect-square flex items-center justify-center rounded-sm text-[10px] font-medium transition-colors text-white/80 ${
                        rec
                          ? "cursor-pointer hover:ring-1 hover:ring-zinc-400"
                          : "text-zinc-600 cursor-default bg-zinc-800/30"
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
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
