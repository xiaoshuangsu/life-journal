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

  // Close on outside click
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
        className="flex w-full items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs transition-colors hover:border-zinc-700"
      >
        <span className="text-zinc-500">{label}</span>
        <span
          className={`${
            selected.size > 0 ? "text-white" : "text-zinc-500"
          }`}
        >
          {summary}
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg z-20 max-h-48 overflow-y-auto">
          {options.map(({ value, count }) => {
            const isSelected = selected.has(value);
            return (
              <button
                key={value}
                type="button"
                onClick={() => onChange(value)}
                className={`flex w-full items-center justify-between px-3 py-2 text-xs transition-colors text-left ${
                  isSelected
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/50"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${
                      isSelected
                        ? "border-white bg-white"
                        : "border-zinc-600"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        className="h-2.5 w-2.5 text-black"
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
                <span className="text-zinc-600">{count}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
