"use client";

import { useState, useTransition, type FormEvent } from "react";
import Card from "./Card";
import { addBloodPressureEntry } from "@/lib/actions";

type Entry = { id: string; rawText: string; loggedAt: string };

export default function BloodPressureCard({ recentEntries }: { recentEntries: Entry[] }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const latest = recentEntries[0];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!text.trim()) {
      setError("Enter a reading, e.g. 120/80.");
      return;
    }
    startTransition(async () => {
      const result = await addBloodPressureEntry(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setText("");
    });
  }

  return (
    <Card title="Blood Pressure" subtitle="Most recent reading">
      <div className="mb-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">{latest ? latest.rawText : "—"}</span>
        <span className="text-lg text-black/40 dark:text-white/40">mmHg</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="120/80"
          className="w-full rounded-xl border border-black/10 bg-canvas px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          Log
        </button>
      </form>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </Card>
  );
}
