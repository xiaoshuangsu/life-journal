"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import EntryEditor from "@/components/entry-editor";
import EntrySidebar from "./sidebar";
import EntryDetail from "./detail";
import type { Entry } from "@/lib/entries/actions";

// Dynamic imports to avoid SSR issues with chart libraries
const CalendarView = dynamic(
  () => import("@/components/visualizations/calendar-view"),
  { ssr: false }
);
const MoodTrend = dynamic(
  () => import("@/components/visualizations/mood-trend"),
  { ssr: false }
);

const TABS = [
  { key: "journal", label: "Journal" },
  { key: "calendar", label: "Calendar" },
  { key: "mood", label: "Mood" },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function DashboardContent({
  initialEntries,
}: {
  initialEntries: Entry[];
}) {
  const [tab, setTab] = useState<Tab>("journal");
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialEntries[0]?.id ?? null
  );
  const [showEditor, setShowEditor] = useState(initialEntries.length === 0);

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  function handleEntryCreated(entry: Entry) {
    setEntries((prev) => [entry, ...prev]);
    setSelectedId(entry.id);
    setShowEditor(false);
  }

  function handleSelect(id: string) {
    setSelectedId(id);
    setShowEditor(false);
  }

  function handleUpdated(updated: Entry) {
    setEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
  }

  function handleNavigateToEntry(entryId: string) {
    setSelectedId(entryId);
    setShowEditor(false);
    setTab("journal");
  }

  function handleNewEntry() {
    setSelectedId(null);
    setShowEditor(true);
  }

  function handleDeleted(deletedId: string) {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    if (selectedId === deletedId) {
      const remaining = entries.filter((e) => e.id !== deletedId);
      setSelectedId(remaining[0]?.id ?? null);
      if (remaining.length === 0) setShowEditor(true);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-zinc-800 pb-0">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.key
                ? "text-zinc-800 dark:text-white"
                : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-white" />
            )}
          </button>
        ))}

        <span className="ml-auto text-xs text-zinc-400 dark:text-zinc-600">
          {entries.length} entr{entries.length === 1 ? "y" : "ies"}
        </span>
      </div>

      {/* Tab content */}
      {tab === "journal" && (
        <div className="flex gap-0 min-h-[calc(100vh-12rem)]">
          <div className="w-80 shrink-0 pr-0">
            <EntrySidebar
              entries={entries}
              selectedId={selectedId}
              onSelect={handleSelect}
            />
          </div>

          <div className="flex-1 pl-6 flex flex-col">
            {!showEditor && entries.length > 0 && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={handleNewEntry}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-base leading-none">+</span>
                  New Entry
                </button>
              </div>
            )}

            <div className="flex-1">
              {showEditor || entries.length === 0 ? (
                <EntryEditor onEntryCreated={handleEntryCreated} />
              ) : selectedEntry ? (
                <EntryDetail
                  entry={selectedEntry}
                  onDeleted={() => handleDeleted(selectedEntry.id)}
                  onUpdated={handleUpdated}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-zinc-400 dark:text-zinc-500">
                  Select an entry from the left or write a new one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "calendar" &&
        (entries.length > 0 ? (
          <CalendarView
            entries={entries}
            onNavigateToEntry={handleNavigateToEntry}
          />
        ) : (
          <EmptyState title="Calendar" icon="📅">
            Write your first journal entry to see your mood calendar.
          </EmptyState>
        ))}

      {tab === "mood" &&
        (entries.length > 0 ? (
          <MoodTrend entries={entries} />
        ) : (
          <EmptyState title="Mood Flow" icon="📈">
            Write at least 2 entries to see your emotional trend.
          </EmptyState>
        ))}
    </div>
  );
}

function EmptyState({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="mt-3 text-lg font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
      <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600">{children}</p>
    </div>
  );
}
