"use client";

import { useEffect, useState, useTransition, type FormEvent } from "react";
import { addRetroactiveEntries, type RetroactiveInput } from "@/lib/actions";

type SymptomOption = { id: string; label: string };

type SectionKey = "water" | "heartRate" | "bloodPressure" | "symptom";

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "water", label: "Water" },
  { key: "heartRate", label: "Heart Rate" },
  { key: "bloodPressure", label: "Blood Pressure" },
  { key: "symptom", label: "Symptom" },
];

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const emptyActive: Record<SectionKey, boolean> = {
  water: false,
  heartRate: false,
  bloodPressure: false,
  symptom: false,
};

export default function AddEntryDialog({ symptomOptions }: { symptomOptions: SymptomOption[] }) {
  const [open, setOpen] = useState(false);
  const [dateTime, setDateTime] = useState(() => toLocalInputValue(new Date()));
  const [active, setActive] = useState(emptyActive);
  const [waterAmount, setWaterAmount] = useState("");
  const [heartRateBpm, setHeartRateBpm] = useState("");
  const [bpText, setBpText] = useState("");
  const [symptomSelect, setSymptomSelect] = useState("");
  const [symptomCustom, setSymptomCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function resetForm() {
    setDateTime(toLocalInputValue(new Date()));
    setActive(emptyActive);
    setWaterAmount("");
    setHeartRateBpm("");
    setBpText("");
    setSymptomSelect("");
    setSymptomCustom("");
    setError(null);
  }

  function close() {
    setOpen(false);
    resetForm();
  }

  function toggleSection(key: SectionKey) {
    setActive((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!active.water && !active.heartRate && !active.bloodPressure && !active.symptom) {
      setError("Choose at least one thing to add.");
      return;
    }

    const parsedLocal = new Date(dateTime);
    if (Number.isNaN(parsedLocal.getTime())) {
      setError("Enter a valid date and time.");
      return;
    }

    const payload: RetroactiveInput = { loggedAt: parsedLocal.toISOString() };

    if (active.water) {
      const amount = parseFloat(waterAmount);
      if (!Number.isFinite(amount) || amount <= 0) {
        setError("Enter a valid water amount.");
        return;
      }
      payload.water = { amountOz: amount };
    }
    if (active.heartRate) {
      const bpm = parseInt(heartRateBpm, 10);
      if (!Number.isInteger(bpm) || bpm < 40 || bpm > 250) {
        setError("Heart rate must be between 40 and 250 bpm.");
        return;
      }
      payload.heartRate = { bpm };
    }
    if (active.bloodPressure) {
      if (!bpText.trim()) {
        setError("Enter a blood pressure reading.");
        return;
      }
      payload.bloodPressure = { rawText: bpText };
    }
    if (active.symptom) {
      const text = symptomCustom.trim() || symptomSelect;
      if (!text) {
        setError("Choose or type a symptom.");
        return;
      }
      payload.symptom = { text };
    }

    startTransition(async () => {
      const result = await addRetroactiveEntries(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      close();
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-card transition-all hover:-translate-y-0.5 hover:bg-accent-hover hover:shadow-cardHover"
      >
        <span className="text-base leading-none">+</span> Add
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-4xl border border-black/5 bg-white p-6 shadow-cardHover dark:border-white/10 dark:bg-[#111113] sm:p-7">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">Add a past entry</h2>
                <p className="mt-0.5 text-sm text-black/45 dark:text-white/45">
                  Log something you missed at the time it happened.
                </p>
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="rounded-full p-1 text-black/40 transition-colors hover:bg-black/5 hover:text-black/70 dark:text-white/40 dark:hover:bg-white/10 dark:hover:text-white/80"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="loggedAt" className="mb-1.5 block text-sm font-medium text-black/60 dark:text-white/60">
                  Date &amp; time
                </label>
                <input
                  id="loggedAt"
                  type="datetime-local"
                  value={dateTime}
                  max={toLocalInputValue(new Date())}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-canvas px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-black/60 dark:text-white/60">
                  What are you adding?
                </p>
                <div className="flex flex-wrap gap-2">
                  {SECTIONS.map((section) => (
                    <button
                      key={section.key}
                      type="button"
                      onClick={() => toggleSection(section.key)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        active[section.key]
                          ? "bg-accent text-white"
                          : "border border-black/10 text-black/60 hover:bg-black/5 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/10"
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>

              {active.water && (
                <div className="rounded-2xl border border-black/5 bg-canvas/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <label htmlFor="waterAmount" className="mb-1.5 block text-sm font-medium text-black/60 dark:text-white/60">
                    Water (oz)
                  </label>
                  <input
                    id="waterAmount"
                    type="number"
                    inputMode="decimal"
                    min={1}
                    max={500}
                    value={waterAmount}
                    onChange={(e) => setWaterAmount(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
                  />
                </div>
              )}

              {active.heartRate && (
                <div className="rounded-2xl border border-black/5 bg-canvas/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <label htmlFor="hrBpm" className="mb-1.5 block text-sm font-medium text-black/60 dark:text-white/60">
                    Heart rate (bpm)
                  </label>
                  <input
                    id="hrBpm"
                    type="number"
                    inputMode="numeric"
                    min={40}
                    max={250}
                    value={heartRateBpm}
                    onChange={(e) => setHeartRateBpm(e.target.value)}
                    placeholder="e.g. 72"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
                  />
                </div>
              )}

              {active.bloodPressure && (
                <div className="rounded-2xl border border-black/5 bg-canvas/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <label htmlFor="bpText" className="mb-1.5 block text-sm font-medium text-black/60 dark:text-white/60">
                    Blood pressure
                  </label>
                  <input
                    id="bpText"
                    type="text"
                    value={bpText}
                    onChange={(e) => setBpText(e.target.value)}
                    placeholder="120/80"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
                  />
                </div>
              )}

              {active.symptom && (
                <div className="space-y-2.5 rounded-2xl border border-black/5 bg-canvas/60 p-4 dark:border-white/10 dark:bg-white/5">
                  <label className="block text-sm font-medium text-black/60 dark:text-white/60">Symptom</label>
                  <select
                    value={symptomSelect}
                    onChange={(e) => {
                      setSymptomSelect(e.target.value);
                      if (e.target.value) setSymptomCustom("");
                    }}
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
                  >
                    <option value="">Select a previous symptom…</option>
                    {symptomOptions.map((option) => (
                      <option key={option.id} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={symptomCustom}
                    onChange={(e) => {
                      setSymptomCustom(e.target.value);
                      if (e.target.value) setSymptomSelect("");
                    }}
                    placeholder="Or describe a new symptom"
                    className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm outline-none ring-accent/40 focus:ring-2 dark:border-white/10 dark:bg-black/30"
                  />
                </div>
              )}

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex justify-end gap-2.5 border-t border-black/5 pt-5 dark:border-white/10">
                <button
                  type="button"
                  onClick={close}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-black/60 transition-colors hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-40"
                >
                  {isPending ? "Adding…" : "Add entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
