"use client";

import { useMemo, useState, useTransition } from "react";
import { deleteEntry, deleteEntries, type EntryType } from "@/lib/actions";
import { TYPE_STYLES, dayLabel, type HistoryType } from "@/lib/historyTypeStyles";
import { SearchIcon, FilterIcon, CloseIcon, TrashIcon, CheckIcon, CheckCircleIcon } from "@/components/icons";

export type HistoryRow = {
  id: string;
  rawId: string;
  entryType: EntryType;
  type: HistoryType;
  summary: string;
  loggedAt: string;
};

const TYPES: Array<HistoryType | "All"> = ["All", "Water", "Heart Rate", "Blood Pressure", "Symptom"];

function toCsv(rows: HistoryRow[]): string {
  const header = ["Date", "Time", "Type", "Value"];
  const lines = rows.map((row) => {
    const date = new Date(row.loggedAt);
    const cells = [date.toLocaleDateString(), date.toLocaleTimeString(), row.type, row.summary.replace(/"/g, '""')];
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
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

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

  // Consecutive same-day rows collapse into one group; `filtered` is already
  // sorted newest-first, so a single pass is enough.
  const grouped = useMemo(() => {
    const groups: { label: string; rows: HistoryRow[] }[] = [];
    for (const row of filtered) {
      const label = dayLabel(new Date(row.loggedAt));
      const last = groups[groups.length - 1];
      if (last && last.label === label) last.rows.push(row);
      else groups.push({ label, rows: [row] });
    }
    return groups;
  }, [filtered]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const hasActiveFilters = typeFilter !== "All" || from !== "" || to !== "";

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
      if (allFilteredSelected) filtered.forEach((r) => next.delete(r.id));
      else filtered.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function handleDelete(row: HistoryRow) {
    const confirmed = window.confirm(`Delete this entry?\n\n${row.type} — ${row.summary}\n\nThis can't be undone.`);
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
    downloadCsv(rows.filter((r) => selected.has(r.id)), "selected");
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

  function clearFilters() {
    setQuery("");
    setTypeFilter("All");
    setFrom("");
    setTo("");
  }

  return (
    <>
      <div className="rounded-4xl border border-black/5 bg-white p-5 shadow-card dark:border-white/10 dark:bg-white/5 sm:p-7">
        {/* ---------- Mobile header: search+filter+select, or the select-mode bar ---------- */}
        <div className="sm:hidden">
          {selectMode ? (
            <div className="mb-4 flex items-center justify-between border-b border-black/5 pb-4 dark:border-white/10">
              <button onClick={toggleSelectMode} className="text-[15px] font-medium text-accent">
                Cancel
              </button>
              <span className="text-[15px] font-semibold">
                {selected.size > 0 ? `${selected.size} Selected` : "Select entries"}
              </span>
              <button onClick={toggleSelectAll} className="text-[15px] font-medium text-accent">
                {allFilteredSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
          ) : (
            <div className="mb-4 flex gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-black/8 bg-canvas px-3.5 py-2.5 dark:border-white/10 dark:bg-black/30">
                <SearchIcon className="h-4 w-4 shrink-0 text-black/35 dark:text-white/35" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search entries"
                  className="w-full min-w-0 bg-transparent text-[15px] outline-none placeholder:text-black/35 dark:placeholder:text-white/35"
                />
              </div>
              <button
                onClick={() => setFilterSheetOpen(true)}
                aria-label="Filters"
                className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white dark:border-white/10 dark:bg-white/5"
              >
                <FilterIcon className="h-[17px] w-[17px] text-black/60 dark:text-white/60" />
                {hasActiveFilters && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent" />}
              </button>
              <button
                onClick={toggleSelectMode}
                aria-label="Select entries"
                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-2xl border border-black/8 bg-white dark:border-white/10 dark:bg-white/5"
              >
                <CheckCircleIcon className="h-[18px] w-[18px] text-black/60 dark:text-white/60" />
              </button>
            </div>
          )}
        </div>

        {/* ---------- Desktop toolbar ---------- */}
        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-3">
          <div className="flex min-w-0 flex-1 basis-64 items-center gap-2 rounded-xl border border-black/10 bg-canvas px-3.5 py-2.5 dark:border-white/10 dark:bg-black/30">
            <SearchIcon className="h-4 w-4 shrink-0 text-black/35 dark:text-white/35" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries"
              className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-black/35 dark:placeholder:text-white/35"
            />
          </div>

          <div className="flex gap-0.5 rounded-xl bg-canvas p-1 dark:bg-black/30">
            {TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  typeFilter === t
                    ? "bg-white text-black shadow-sm dark:bg-white/15 dark:text-white"
                    : "text-black/55 hover:text-black/80 dark:text-white/55 dark:hover:text-white/80"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-black/10 bg-canvas px-3 py-2 text-[13px] outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
            />
            <span className="text-black/30 dark:text-white/30">–</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-black/10 bg-canvas px-3 py-2 text-[13px] outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
            />
          </div>

          <div className="ml-auto flex gap-2">
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

        {/* ---------- Desktop select-mode contextual bar ---------- */}
        {selectMode && (
          <div className="mt-4 hidden flex-wrap items-center gap-3 rounded-2xl bg-accent/10 px-4 py-3 sm:flex">
            <label className="flex items-center gap-2 text-sm font-medium text-accent">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-black/20 text-accent focus:ring-accent/40"
              />
              {selected.size > 0 ? `${selected.size} selected` : filtered.length > 0 ? "Select all" : "Nothing to select"}
            </label>
            <div className="ml-auto flex gap-2">
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

        {actionError && <p className="mb-1 mt-4 text-sm text-red-500">{actionError}</p>}

        {/* ---------- Mobile: grouped card list ---------- */}
        <div className={`mt-4 space-y-6 sm:hidden ${selectMode ? "pb-24" : ""}`}>
          {grouped.length === 0 && (
            <p className="py-14 text-center text-sm text-black/40 dark:text-white/40">No entries match.</p>
          )}
          {grouped.map((group) => (
            <div key={group.label}>
              <div className="mb-2.5 pl-0.5 text-[13px] font-semibold uppercase tracking-wide text-black/40 dark:text-white/40">
                {group.label}
              </div>
              <div className="space-y-2.5">
                {group.rows.map((row) => {
                  const style = TYPE_STYLES[row.type];
                  const Icon = style.Icon;
                  const isSelected = selected.has(row.id);
                  const time = new Date(row.loggedAt).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={row.id}
                      onClick={selectMode ? () => toggleRow(row.id) : undefined}
                      className={`flex items-center gap-3 rounded-[20px] border p-3 transition-colors ${
                        selectMode ? "cursor-pointer" : ""
                      } ${
                        selectMode && isSelected
                          ? `${style.tint} ${style.ring}`
                          : "border-black/5 bg-white dark:border-white/10 dark:bg-white/[0.03]"
                      }`}
                    >
                      {selectMode && (
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                            isSelected ? "border-accent bg-accent" : "border-black/15 dark:border-white/20"
                          }`}
                        >
                          {isSelected && <CheckIcon className="h-3 w-3 text-white" />}
                        </span>
                      )}
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${style.chipBg} ${style.chipText}`}>
                        <Icon className="h-[19px] w-[19px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[11px] font-semibold uppercase tracking-wide ${style.chipText}`}>
                          {row.type}
                        </span>
                        <span className="mt-0.5 block truncate text-[17px] font-semibold">{row.summary}</span>
                      </span>
                      <span className="shrink-0 text-[13px] text-black/45 dark:text-white/45">{time}</span>
                      {!selectMode && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(row);
                          }}
                          disabled={isPending && deletingId === row.id}
                          aria-label={`Delete ${row.type} entry`}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-black/25 transition-colors hover:text-red-500 disabled:opacity-30 dark:text-white/25"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ---------- Desktop: table ---------- */}
        <div className="mt-6 hidden overflow-hidden rounded-2xl border border-black/5 dark:border-white/10 sm:block">
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
                  <td colSpan={selectMode ? 5 : 4} className="px-4 py-10 text-center text-black/40 dark:text-white/40">
                    No entries match.
                  </td>
                </tr>
              )}
              {filtered.map((row) => {
                const style = TYPE_STYLES[row.type];
                const Icon = style.Icon;
                return (
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
                    <td className="whitespace-nowrap px-4 py-3.5 text-black/60 dark:text-white/60">
                      {new Date(row.loggedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full py-1 pl-1.5 pr-3 text-xs font-semibold ${style.chipBg} ${style.chipText}`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        {row.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{row.summary}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right">
                      {!selectMode && (
                        <button
                          onClick={() => handleDelete(row)}
                          disabled={isPending && deletingId === row.id}
                          aria-label={`Delete ${row.type} entry`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-black/30 transition-colors hover:text-red-500 disabled:opacity-30 dark:text-white/30"
                        >
                          <TrashIcon className="h-[15px] w-[15px]" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-black/35 dark:text-white/35">
          {filtered.length} of {rows.length} entries
        </p>
      </div>

      {/* ---------- Mobile filter sheet ---------- */}
      {filterSheetOpen && (
        <div
          className="fixed inset-0 z-50 sm:hidden"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFilterSheetOpen(false);
          }}
        >
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[28px] bg-white p-6 pb-8 shadow-2xl dark:bg-[#111113]">
            <div className="mx-auto mb-5 h-1 w-9 rounded-full bg-black/15 dark:bg-white/20" />
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">Filters</h3>
              <button
                onClick={() => setFilterSheetOpen(false)}
                aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-black/50 dark:bg-white/10 dark:text-white/50"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-black/60 dark:text-white/60">Search</label>
              <div className="flex items-center gap-2 rounded-2xl bg-canvas px-3.5 py-3 dark:bg-black/30">
                <SearchIcon className="h-4 w-4 shrink-0 text-black/35 dark:text-white/35" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g. headache"
                  className="w-full min-w-0 bg-transparent text-[15px] outline-none"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-black/60 dark:text-white/60">Type</label>
              <div className="flex flex-wrap gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeFilter(t)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      typeFilter === t ? "bg-accent text-white" : "bg-canvas text-black/60 dark:bg-black/30 dark:text-white/60"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-black/60 dark:text-white/60">Date range</label>
              <div className="flex items-center gap-2.5">
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full min-w-0 rounded-2xl bg-canvas px-3.5 py-3 text-sm outline-none dark:bg-black/30"
                />
                <span className="shrink-0 text-black/30 dark:text-white/30">–</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full min-w-0 rounded-2xl bg-canvas px-3.5 py-3 text-sm outline-none dark:bg-black/30"
                />
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={clearFilters}
                className="flex-1 rounded-2xl border border-black/10 py-3.5 text-[15px] font-semibold text-black/70 dark:border-white/15 dark:text-white/70"
              >
                Clear
              </button>
              <button
                onClick={() => setFilterSheetOpen(false)}
                className="flex-[2] rounded-2xl bg-accent py-3.5 text-[15px] font-semibold text-white shadow-card"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Mobile select-mode bottom action bar ---------- */}
      {selectMode && (
        <div className="fixed inset-x-0 bottom-0 z-50 flex gap-2.5 border-t border-black/6 bg-white/95 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3.5 backdrop-blur-xl dark:border-white/10 dark:bg-black/90 sm:hidden">
          <button
            onClick={handleExportSelected}
            disabled={selected.size === 0}
            className="flex-1 rounded-2xl border-[1.5px] border-accent/30 bg-white py-3.5 text-[15px] font-semibold text-accent disabled:opacity-40 dark:bg-transparent"
          >
            Export Selected
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={selected.size === 0 || isPending}
            className="flex-1 rounded-2xl bg-red-500 py-3.5 text-[15px] font-semibold text-white disabled:opacity-40"
          >
            {isPending ? "Deleting…" : "Delete Selected"}
          </button>
        </div>
      )}
    </>
  );
}
