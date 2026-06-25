"use client";

import { useState, useRef, useEffect } from "react";
import { dotStyle } from "@/lib/emotion-colors";

type MultiSelectProps = {
  label: string;
  options: { value: string; count: number }[];
  selected: Set<string>;
  onChange: (value: string) => void;
};

export default function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isEmotion = label === "Emotion";

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
      >
        <span className="text-slate-600 dark:text-slate-300 font-medium">
          {label}
        </span>
        <span className="text-slate-400 dark:text-slate-500 text-[10px] scale-90">
          ▾
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-20 min-w-[14rem] rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-100 dark:border-white/10 shadow-xl dark:shadow-2xl backdrop-blur-md p-2 max-h-60 overflow-y-auto scrollbar-none">
          {options.map(({ value, count }) => {
            const isSelected = selected.has(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  isSelected
                    ? "bg-slate-100 dark:bg-white/10"
                    : "hover:bg-slate-50 dark:hover:bg-white/5"
                }`}
              >
                {/* Left: checkbox + label */}
                <span className="flex items-center gap-2.5">
                  {/* Checkbox */}
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${
                      isSelected
                        ? "border-zinc-700 dark:border-white bg-zinc-700 dark:bg-white"
                        : "border-slate-300 dark:border-white/20"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-2.5 w-2.5 text-white dark:text-black"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>

                  {/* Emotion dot */}
                  {isEmotion && (
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={dotStyle(value)}
                    />
                  )}

                  {/* Label */}
                  <span className="text-zinc-700 dark:text-zinc-200">
                    {value}
                  </span>
                </span>

                {/* Count */}
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums font-medium">
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
