"use client";

import { badgeStyle } from "@/lib/emotion-colors";
import type { Entry } from "@/lib/entries/actions";

type EntryPreviewProps = {
  date: string;
  entries: Entry[];
  dominantEmotion: string | null;
  onViewEntry: (entryId: string) => void;
  onClose: () => void;
};

function getAnalysis(entry: Entry) {
  const a = entry.analysis;
  if (!a) return null;
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

function moodBadge(emotion: string) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={badgeStyle(emotion)}
    >
      {emotion}
    </span>
  );
}

function formatFullDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateStr + "T00:00:00"));
}

export default function EntryPreview({
  date,
  entries,
  dominantEmotion,
  onViewEntry,
  onClose,
}: EntryPreviewProps) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            {formatFullDate(date)}
          </h4>
          {dominantEmotion && (
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={badgeStyle(dominantEmotion)}
            >
              {dominantEmotion}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-sm"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2">
        {entries.map((entry) => {
          const analysis = getAnalysis(entry);
          return (
            <div
              key={entry.id}
              className="rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 p-3"
            >
              <p className="text-sm text-zinc-700 dark:text-zinc-300 line-clamp-3 whitespace-pre-wrap">
                {entry.content}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {analysis?.emotion_tags?.map((tag) => moodBadge(tag))}
                </div>
                <button
                  onClick={() => onViewEntry(entry.id)}
                  className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  View full entry →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
