"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import Card from "./Card";
import { addWaterEntry } from "@/lib/actions";

type Entry = { id: string; amountOz: number; loggedAt: string };

export default function WaterCard({ recentEntries }: { recentEntries: Entry[] }) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const todayTotal = useMemo(() => {
    const today = new Date().toDateString();
    return recentEntries
      .filter((e) => new Date(e.loggedAt).toDateString() === today)
      .reduce((sum, e) => sum + e.amountOz, 0);
  }, [recentEntries]);

  function logAmount(amountOz: number) {
    setError(null);
    startTransition(async () => {
      const result = await addWaterEntry(amountOz);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setCustomAmount("");
      setCustomOpen(false);
    });
  }

  function handleCustomSubmit(e: FormEvent) {
    e.preventDefault();
    const amount = parseFloat(customAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    logAmount(amount);
  }

  return (
    <Card title="Water" subtitle="Today's intake">
      <div className="mb-5 flex items-baseline gap-1.5">
        <span className="text-4xl font-semibold tracking-tight">{todayTotal}</span>
        <span className="text-lg text-black/40 dark:text-white/40">oz</span>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={() => logAmount(32)}
          disabled={isPending}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
        >
          + Add 32 oz
        </button>
        <button
          onClick={() => setCustomOpen((v) => !v)}
          disabled={isPending}
          className="rounded-full border border-black/10 px-5 py-2.5 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 disabled:opacity-40 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
        >
          Custom amount
        </button>
      </div>

      {customOpen && (
        <form onSubmit={handleCustomSubmit} className="mt-3 flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            min={1}
            max={500}
            autoFocus
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Amount in oz"
            className="w-full rounded-xl border border-black/10 bg-canvas px-3.5 py-2 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
          />
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 rounded-xl bg-black/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-40 dark:bg-white dark:text-black"
          >
            Add
          </button>
        </form>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </Card>
  );
}
