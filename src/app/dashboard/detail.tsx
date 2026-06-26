"use client";

import { useState, useRef, useEffect } from "react";
import { deleteEntry, updateEntry, generateEntryInsights } from "@/lib/entries/actions";
import { badgeStyle } from "@/lib/emotion-colors";
import type { Entry } from "@/lib/entries/actions";

type EntryDetailProps = {
  entry: Entry;
  onDeleted: () => void;
  onUpdated: (entry: Entry) => void;
};

function getAnalysis(entry: Entry) {
  const a = entry.analysis;
  if (!a) return null;
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

function moodBadge(emotion: string) {
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={badgeStyle(emotion)}
    >
      {emotion}
    </span>
  );
}

function formatFullDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export default function EntryDetail({
  entry,
  onDeleted,
  onUpdated,
}: EntryDetailProps) {
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const analysis = getAnalysis(entry);
  const insightsRaw = analysis?.insights ?? null;
  const insights =
    insightsRaw && "seen" in (insightsRaw as Record<string, unknown>)
      ? insightsRaw
      : null;
  const primary = analysis?.primary_emotion;
  const tags = (analysis?.emotion_tags ?? []).filter(
    (t) => t.toLowerCase() !== primary?.toLowerCase()
  );

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      );
    }
  }, [editing]);

  async function handleDelete() {
    try {
      await deleteEntry(entry.id);
      onDeleted();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function handleEdit() {
    setEditContent(entry.content);
    setEditing(true);
  }

  function handleCancelEdit() {
    setEditing(false);
    setEditContent(entry.content);
  }

  async function handleGenerateInsights() {
    setLoadingInsights(true);
    try {
      const updated = await generateEntryInsights(entry.id);
      if (updated) onUpdated(updated);
    } catch (err) {
      console.error("Insights generation failed:", err);
    } finally {
      setLoadingInsights(false);
    }
  }

  async function handleSaveEdit() {
    const trimmed = editContent.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const updated = await updateEntry(entry.id, trimmed);
      if (updated) {
        onUpdated(updated);
        setEditing(false);
      }
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setSaving(false);
    }
  }

  // ── Edit mode ──
  if (editing) {
    return (
      <div className="max-w-2xl py-2 space-y-4">
        <div className="flex items-center justify-between mb-1 px-1">
          <span className="text-xs text-zinc-400 dark:text-zinc-500">Editing</span>
          <button
            onClick={handleCancelEdit}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900/40 dark:backdrop-blur-md shadow-sm p-6">
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={10}
            maxLength={5000}
            disabled={saving}
            className="w-full resize-none rounded-lg border border-slate-200 dark:border-zinc-700 bg-transparent px-4 py-3 text-sm text-zinc-800 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-zinc-400 dark:focus:border-zinc-500 focus:outline-none transition-colors"
          />

          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-zinc-400 dark:text-zinc-500">
              {editContent.length} / 5000
            </span>
            <button
              onClick={handleSaveEdit}
              disabled={!editContent.trim() || saving}
              className="rounded-lg bg-zinc-800 dark:bg-white px-4 py-2 text-sm font-medium text-white dark:text-black hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-40 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── View mode ──
  return (
    <div className="max-w-2xl py-2 space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-end mb-1 px-1">
        <div className="flex items-center gap-3">
          <button
            onClick={handleEdit}
            className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors"
          >
            Edit
          </button>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="text-xs text-zinc-400 dark:text-zinc-600 hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">Delete?</span>
              <button
                onClick={handleDelete}
                className="rounded px-2 py-0.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10"
              >
                Yes
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="rounded px-2 py-0.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                No
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900/40 dark:backdrop-blur-md shadow-sm p-6 space-y-5">
        {/* Date */}
        <time className="text-sm text-zinc-400 dark:text-zinc-500">
          {formatFullDate(entry.created_at)}
        </time>

        {/* Title */}
        {entry.title && (
          <h2 className="text-xl font-semibold text-zinc-800 dark:text-white">
            {entry.title}
          </h2>
        )}

        {/* User content */}
        <div>
          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap">
            {entry.content}
          </p>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 dark:border-zinc-800" />

        {/* AI Analysis section */}
        <div className="space-y-4">
          {/* Mood bar */}
          {entry.mood_score != null && (
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-600 w-12 shrink-0">Mood</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    entry.mood_score >= 0.3
                      ? "bg-emerald-500"
                      : entry.mood_score >= -0.3
                        ? "bg-zinc-400 dark:bg-zinc-500"
                        : "bg-red-500"
                  }`}
                  style={{
                    width: `${Math.abs(entry.mood_score) * 100}%`,
                    marginLeft: entry.mood_score < 0 ? "auto" : undefined,
                  }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 tabular-nums w-10 text-right">
                {entry.mood_score > 0 ? "+" : ""}
                {entry.mood_score.toFixed(2)}
              </span>
            </div>
          )}

          {/* Emotion tags */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-zinc-400 dark:text-zinc-600 w-12 shrink-0">Tags</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {primary && moodBadge(primary)}
              {tags.map((tag) => moodBadge(tag))}
            </div>
          </div>

          {/* Life Themes */}
          {analysis?.life_themes && analysis.life_themes.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-600 w-12 shrink-0">Themes</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {analysis.life_themes.map((theme) => (
                  <span
                    key={theme}
                    className="rounded-full bg-slate-200 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 px-3 py-1 text-[11px]"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights card */}
      <div className="space-y-0">
        {!insights ? (
          <div
            className={`rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-slate-900/40 dark:backdrop-blur-md shadow-sm px-6 py-5 ${
              loadingInsights ? "opacity-50" : ""
            }`}
          >
            <button
              onClick={handleGenerateInsights}
              disabled={loadingInsights}
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors disabled:cursor-wait"
            >
              <span>{loadingInsights ? "⏳" : "✨"}</span>
              <span>
                {loadingInsights ? "Generating insights..." : "Generate AI Insights"}
              </span>
            </button>
            <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-600">
              AI will analyze your emotional patterns based on all your journal entries
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-slate-900/40 dark:backdrop-blur-md shadow-sm px-6 py-5 space-y-4">
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">💭 今日洞察</p>
            <div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2">我看见</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {insights.seen}
              </p>
            </div>
            <div className="pt-3">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2">我发现</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {insights.hidden_pattern}
              </p>
            </div>
            <div className="pt-3">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2">我想告诉你</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {insights.growth_mirror}
              </p>
            </div>
            <div className="pt-3">
              <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2">留一个问题给未来的你</p>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {insights.looking_ahead}
              </p>
            </div>
          </div>
        )}
      </div>

      <p className="mt-8 text-[11px] text-zinc-400 dark:text-zinc-700 text-center">
        {entry.word_count} words
      </p>
    </div>
  );
}
