"use client";

import { useState, useTransition, type FormEvent } from "react";
import Card from "./Card";
import { addHeartRateEntry } from "@/lib/actions";

type Entry = { id: string; bpm: number; loggedAt: string };

export default function HeartRateCard({ recentEntries }: { recentEntries: Entry[] }) {
  const [bpm, setBpm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const latest = recentEntries[0];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const value = parseInt(bpm, 10);
    if (!Number.isInteger(value) || value < 40 || value > 250) {
      setError("Enter a heart rate between 40 and 250 bpm.");
      return;
    }

    startTransition(async () => {
      const result = await addHeartRateEntry(value);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBpm("");
    });
  }

  return (
    <Card title="Heart Rate" subtitle="Most recent reading">
      <div className="mb-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">{latest ? latest.bpm : "—"}</span>
        <span className="text-lg text-black/40 dark:text-white/40">bpm</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="number"
          inputMode="numeric"
          min={40}
          max={250}
          value={bpm}
          onChange={(e) => setBpm(e.target.value)}
          placeholder="e.g. 72"
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
