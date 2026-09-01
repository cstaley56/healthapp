"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteEntry, type EntryType } from "@/lib/actions";

export type HistoryRow = {
  id: string;
  rawId: string;
  entryType: EntryType;
  type: "Water" | "Heart Rate" | "Blood Pressure" | "Symptom";
  summary: string;
  loggedAt: string;
};

const TYPES: Array<HistoryRow["type"] | "All"> = ["All", "Water", "Heart Rate", "Blood Pressure", "Symptom"];

function toCsv(rows: HistoryRow[]): string {
  const header = ["Date", "Time", "Type", "Value"];
  const lines = rows.map((row) => {
    const date = new Date(row.loggedAt);
    const cells = [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      row.type,
      row.summary.replace(/"/g, '""'),
    ];
    return cells.map((cell) => `"${cell}"`).join(",");
  });
  return [header.join(","), ...lines].join("\n");
}

export default function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const fromTime = from ? new Date(from).getTime() : null;
    const toTime = to ? new Date(to + "T23:59:59").getTime() : null;

    return rows.filter((row) => {
      if (typeFilter !== "All" && row.type !== typeFilter) return false;
      if (normalizedQuery && !row.summary.toLowerCase().includes(normalizedQuery)) return false;
      const rowTime = new Date(row.loggedAt).getTime();
      if (fromTime !== null && rowTime < fromTime) return false;
      if (toTime !== null && rowTime > toTime) return false;
      return true;
    });
  }, [rows, query, typeFilter, from, to]);

  function handleDelete(row: HistoryRow) {
    const confirmed = window.confirm(
      `Delete this entry?\n\n${row.type} — ${row.summary}\n\nThis can't be undone.`
    );
    if (!confirmed) return;

    setDeleteError(null);
    setDeletingId(row.id);
    startTransition(async () => {
      const result = await deleteEntry(row.entryType, row.rawId);
      setDeletingId(null);
      if (!result.ok) {
        setDeleteError(result.error);
      }
    });
  }

  function handleExport() {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `health-history-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-4xl border border-black/5 bg-white p-6 shadow-card dark:border-white/10 dark:bg-white/5 sm:p-7">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search (e.g. headache)"
          className="min-w-0 flex-1 rounded-xl border border-black/10 bg-canvas px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as (typeof TYPES)[number])}
          className="rounded-xl border border-black/10 bg-canvas px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl border border-black/10 bg-canvas px-3 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
          />
          <span className="text-black/30 dark:text-white/30">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl border border-black/10 bg-canvas px-3 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
          />
        </div>
        <button
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="rounded-xl bg-black/90 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-30 dark:bg-white dark:text-black sm:ml-auto"
        >
          Export CSV
        </button>
      </div>

      {deleteError && <p className="mb-3 text-sm text-red-500">{deleteError}</p>}

      <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 bg-black/[0.02] text-left text-black/50 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
              <th className="px-4 py-3 font-medium">Date &amp; time</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-black/40 dark:text-white/40">
                  No entries match.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="border-b border-black/5 last:border-0 dark:border-white/5">
                <td className="whitespace-nowrap px-4 py-3 text-black/60 dark:text-white/60">
                  {new Date(row.loggedAt).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                    {row.type}
                  </span>
                </td>
                <td className="px-4 py-3">{row.summary}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(row)}
                    disabled={isPending && deletingId === row.id}
                    aria-label={`Delete ${row.type} entry`}
                    className="text-black/30 transition-colors hover:text-red-500 disabled:opacity-30 dark:text-white/30"
                  >
                    {isPending && deletingId === row.id ? "…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-black/35 dark:text-white/35">
        {filtered.length} of {rows.length} entries
      </p>
    </div>
  );
}
