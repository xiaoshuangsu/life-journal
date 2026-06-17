"use client";

import { useState } from "react";
import { deleteEntry } from "@/lib/entries/actions";

export default function DeleteButton({ entryId }: { entryId: string }) {
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    try {
      await deleteEntry(entryId);
    } catch (err) {
      console.error("Failed to delete entry:", err);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-zinc-600 hover:text-red-400"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs">
      <span className="text-zinc-500">Sure?</span>
      <button
        onClick={handleDelete}
        className="rounded px-1.5 py-0.5 text-red-400 hover:bg-red-400/10"
      >
        Yes
      </button>
      <button
        onClick={() => setConfirming(false)}
        className="rounded px-1.5 py-0.5 text-zinc-400 hover:bg-zinc-800"
      >
        No
      </button>
    </div>
  );
}
