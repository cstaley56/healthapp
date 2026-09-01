"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteEntry, deleteEntries, type EntryType } from "@/lib/actions";

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

function downloadCsv(rows: HistoryRow[], filenameSuffix: string) {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `health-history-${filenameSuffix}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPES)[number]>("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleSelectMode() {
    setSelectMode((v) => !v);
    setSelected(new Set());
    setActionError(null);
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        filtered.forEach((r) => next.delete(r.id));
      } else {
        filtered.forEach((r) => next.add(r.id));
      }
      return next;
    });
  }

  function handleDelete(row: HistoryRow) {
    const confirmed = window.confirm(
      `Delete this entry?\n\n${row.type} — ${row.summary}\n\nThis can't be undone.`
    );
    if (!confirmed) return;

    setActionError(null);
    setDeletingId(row.id);
    startTransition(async () => {
      const result = await deleteEntry(row.entryType, row.rawId);
      setDeletingId(null);
      if (!result.ok) setActionError(result.error);
    });
  }

  function handleExport() {
    downloadCsv(filtered, "all");
  }

  function handleExportSelected() {
    const chosen = rows.filter((r) => selected.has(r.id));
    downloadCsv(chosen, "selected");
  }

  function handleBulkDelete() {
    const chosen = rows.filter((r) => selected.has(r.id));
    if (chosen.length === 0) return;

    const confirmed = window.confirm(
      `Delete ${chosen.length} selected ${chosen.length === 1 ? "entry" : "entries"}? This can't be undone.`
    );
    if (!confirmed) return;

    setActionError(null);
    startTransition(async () => {
      const result = await deleteEntries(chosen.map((r) => ({ type: r.entryType, id: r.rawId })));
      if (!result.ok) {
        setActionError(result.error);
        return;
      }
      setSelected(new Set());
      setSelectMode(false);
    });
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
        <div className="flex gap-2 sm:ml-auto">
          <button
            onClick={toggleSelectMode}
            className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              selectMode
                ? "bg-accent text-white hover:bg-accent-hover"
                : "border border-black/10 text-black/70 hover:bg-black/5 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10"
            }`}
          >
            {selectMode ? "Done" : "Select"}
          </button>
          <button
            onClick={handleExport}
            disabled={filtered.length === 0}
            className="rounded-xl bg-black/90 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-30 dark:bg-white dark:text-black"
          >
            Export CSV
          </button>
        </div>
      </div>

      {selectMode && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl bg-accent/10 px-4 py-3">
          <label className="flex items-center gap-2 text-sm font-medium text-accent">
            <input
              type="checkbox"
              checked={allFilteredSelected}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-black/20 text-accent focus:ring-accent/40"
            />
            {selected.size > 0
              ? `${selected.size} selected`
              : filtered.length > 0
                ? "Select all"
                : "Nothing to select"}
          </label>
          <div className="flex gap-2 sm:ml-auto">
            <button
              onClick={handleExportSelected}
              disabled={selected.size === 0}
              className="rounded-xl border border-accent/30 bg-white px-4 py-2 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-40 dark:bg-transparent"
            >
              Export Selected
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={selected.size === 0 || isPending}
              className="rounded-xl bg-red-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-600 disabled:opacity-40"
            >
              {isPending ? "Deleting…" : "Delete Selected"}
            </button>
          </div>
        </div>
      )}

      {actionError && <p className="mb-3 text-sm text-red-500">{actionError}</p>}

      <div className="overflow-hidden rounded-2xl border border-black/5 dark:border-white/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 bg-black/[0.02] text-left text-black/50 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
              {selectMode && <th className="w-10 px-4 py-3"></th>}
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
                <td
                  colSpan={selectMode ? 5 : 4}
                  className="px-4 py-10 text-center text-black/40 dark:text-white/40"
                >
                  No entries match.
                </td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-black/5 last:border-0 dark:border-white/5 ${
                  selectMode && selected.has(row.id) ? "bg-accent/5" : ""
                }`}
              >
                {selectMode && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      aria-label={`Select ${row.type} entry`}
                      className="h-4 w-4 rounded border-black/20 text-accent focus:ring-accent/40"
                    />
                  </td>
                )}
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
                  {!selectMode && (
                    <button
                      onClick={() => handleDelete(row)}
                      disabled={isPending && deletingId === row.id}
                      aria-label={`Delete ${row.type} entry`}
                      className="text-black/30 transition-colors hover:text-red-500 disabled:opacity-30 dark:text-white/30"
                    >
                      {isPending && deletingId === row.id ? "…" : "Delete"}
                    </button>
                  )}
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
