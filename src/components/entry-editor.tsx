"use client";

import { useState, useRef } from "react";
import { createEntry } from "@/lib/entries/actions";
import type { Entry } from "@/lib/entries/actions";

type EntryEditorProps = {
  onEntryCreated: (entry: Entry) => void;
};

export default function EntryEditor({ onEntryCreated }: EntryEditorProps) {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit() {
    const trimmed = content.trim();
    if (!trimmed) return;

    setSaving(true);
    setError(null);

    try {
      const entry = await createEntry(trimmed);
      setContent("");
      onEntryCreated(entry);
      textareaRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setContent("");
      textareaRef.current?.blur();
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-slate-900/40 dark:backdrop-blur-md shadow-sm p-6 transition-colors">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="How are you feeling today? Just start writing..."
        rows={4}
        maxLength={5000}
        disabled={saving}
        className="w-full resize-none bg-transparent text-base text-zinc-800 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
      />

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {content.length > 0
            ? `${content.length} / 5000  —  ⌘↵ to save`
            : "Write naturally. AI will tag your emotions."}
        </span>

        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs text-red-500">{error}</span>
          )}
          <button
            onClick={handleSubmit}
            disabled={!content.trim() || saving}
            className="rounded-lg bg-zinc-800 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
          >
            {saving ? "Analyzing..." : "Save & Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}
