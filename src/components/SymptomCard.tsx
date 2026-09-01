"use client";

import { useState, useTransition, type FormEvent } from "react";
import Card from "./Card";
import { addSymptomEntry } from "@/lib/actions";

type Entry = { id: string; text: string; loggedAt: string };
type Option = { id: string; label: string };

export default function SymptomCard({
  recentEntries,
  options,
}: {
  recentEntries: Entry[];
  options: Option[];
}) {
  const [selected, setSelected] = useState("");
  const [customText, setCustomText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const text = customText.trim() || selected;
    if (!text) {
      setError("Choose a previous symptom or type a new one.");
      return;
    }

    startTransition(async () => {
      const result = await addSymptomEntry(text);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCustomText("");
      setSelected("");
    });
  }

  return (
    <Card title="Symptoms" subtitle="Recent entries">
      <div className="mb-5 space-y-1.5">
        {recentEntries.length === 0 && (
          <p className="text-sm text-black/40 dark:text-white/40">Nothing logged yet.</p>
        )}
        {recentEntries.slice(0, 4).map((entry) => (
          <div key={entry.id} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{entry.text}</span>
            <span className="shrink-0 text-black/35 dark:text-white/35">
              {new Date(entry.loggedAt).toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5">
        <select
          value={selected}
          onChange={(e) => {
            setSelected(e.target.value);
            if (e.target.value) setCustomText("");
          }}
          className="w-full rounded-xl border border-black/10 bg-canvas px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
        >
          <option value="">Select a previous symptom…</option>
          {options.map((option) => (
            <option key={option.id} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            type="text"
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              if (e.target.value) setSelected("");
            }}
            placeholder="Or describe a new symptom"
            className="w-full rounded-xl border border-black/10 bg-canvas px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
          >
            Log
          </button>
        </div>
      </form>

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </Card>
  );
}
