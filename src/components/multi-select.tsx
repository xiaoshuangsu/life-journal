"use client";

import { useState, useRef, useEffect } from "react";

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

  const summary =
    selected.size === 0
      ? "All"
      : selected.size === 1
        ? [...selected][0]
        : `${selected.size} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 px-4 py-2 text-xs transition-colors hover:border-slate-300 dark:hover:border-zinc-700"
      >
        <span className="text-zinc-400 dark:text-zinc-500">{label}</span>
        <span
          className={`${
            selected.size > 0
              ? "text-zinc-700 dark:text-white"
              : "text-zinc-400 dark:text-zinc-500"
          }`}
        >
          {summary}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg dark:shadow-none z-20 max-h-48 overflow-y-auto">
          {options.map(({ value, count }) => {
            const isSelected = selected.has(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                  isSelected
                    ? "bg-slate-100 dark:bg-zinc-800 text-zinc-800 dark:text-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                      isSelected
                        ? "border-zinc-700 dark:border-white bg-zinc-700 dark:bg-white"
                        : "border-slate-300 dark:border-zinc-600"
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
                  {value}
                </span>
                <span className="text-zinc-400 dark:text-zinc-600">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
