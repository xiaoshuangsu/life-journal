"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import EntryEditor from "@/components/entry-editor";
import type { Entry } from "@/lib/entries/actions";
import JournalList from "@/components/journal-list";

const EntryDetail = dynamic(
  () => import("@/app/dashboard/detail"),
  { ssr: false }
);

export default function HomeContent({
  userEmail,
  initialEntries,
  initialMirror,
}: {
  userEmail?: string;
  initialEntries: Entry[];
  initialMirror: string | null;
}) {
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [mirror] = useState<string | null>(initialMirror);
  const [view, setView] = useState<"home" | "editor" | "detail">("home");
  const [selectedEntry, setSelectedEntry] = useState<Entry | null>(null);

  function handleEntryCreated(entry: Entry) {
    setEntries((prev) => [entry, ...prev]);
    setSelectedEntry(entry);
    setView("detail");
  }

  function handleSelectEntry(entry: Entry) {
    setSelectedEntry(entry);
    setView("detail");
  }

  function handleUpdated(updated: Entry) {
    setEntries((prev) =>
      prev.map((e) => (e.id === updated.id ? updated : e))
    );
    setSelectedEntry(updated);
  }

  function handleDeleted(deletedId: string) {
    setEntries((prev) => prev.filter((e) => e.id !== deletedId));
    setView("home");
  }

  // View: Editor
  if (view === "editor") {
    return (
      <div className="max-w-[720px] mx-auto">
        <button
          onClick={() => setView("home")}
          className="text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white mb-4 transition-colors"
        >
          ← Back
        </button>
        <EntryEditor onEntryCreated={handleEntryCreated} />
      </div>
    );
  }

  // View: Detail
  if (view === "detail" && selectedEntry) {
    return (
      <div className="max-w-[720px] mx-auto">
        <button
          onClick={() => setView("home")}
          className="text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white mb-4 transition-colors"
        >
          ← Back
        </button>
        <EntryDetail
          entry={selectedEntry}
          onDeleted={() => handleDeleted(selectedEntry.id)}
          onUpdated={handleUpdated}
          onNewEntry={() => setView("editor")}
        />
      </div>
    );
  }

  // View: Home (Mirror + Editor + Recent)
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayEntry = entries.find(
    (e) => (e.entry_date ?? e.created_at.slice(0, 10)) === todayStr
  );

  return (
    <div className="max-w-[720px] mx-auto space-y-8 md:space-y-10">
      {/* Today's Mirror */}
      <div className="text-center py-6 md:py-10 space-y-4">
        <p className="text-sm text-zinc-400 dark:text-zinc-500 tracking-wide">
          {new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          }).format(new Date())}
        </p>
        <p className="text-xl md:text-2xl font-medium text-zinc-700 dark:text-zinc-200 leading-relaxed max-w-md mx-auto">
          {todayEntry ? (
            "You have already written today. Take a moment to reflect."
          ) : (
            <>
              世界总在催促我们成为别人。
              <br />
              而这里，只想陪你慢慢看见真正的自己。
            </>
          )}
        </p>
        {!todayEntry && (
          <button
            onClick={() => setView("editor")}
            className="inline-flex items-center gap-2 rounded-full bg-zinc-800 dark:bg-white text-white dark:text-black px-6 py-3 text-[15px] font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
          >
            Continue Writing
          </button>
        )}
      </div>

      {/* Today's Mirror */}
      {mirror && (
        <div className="rounded-3xl bg-[#FAF8F5] dark:bg-slate-900/60 px-6 md:px-8 py-8 md:py-10">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 tracking-wide mb-6 uppercase">
            Today's Mirror
          </p>
          <div className="journal-body text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {mirror}
          </div>
        </div>
      )}

      {/* Editor (if not yet written today) */}
      {!todayEntry && (
        <div onClick={() => setView("editor")} className="cursor-pointer">
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-slate-900/40 dark:backdrop-blur-md shadow-sm p-4 md:p-6 transition-colors">
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">
              What happened today? Just start writing...
            </p>
          </div>
        </div>
      )}

      {/* Recent Entries */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-zinc-400 dark:text-zinc-500 tracking-wide uppercase">
          Recent
        </h2>
        <JournalList
          entries={entries}
          onSelect={handleSelectEntry}
        />
      </div>
    </div>
  );
}
