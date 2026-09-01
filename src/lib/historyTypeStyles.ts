import type { ComponentType } from "react";
import { WaterIcon, HeartIcon, PulseIcon, NoteIcon } from "@/components/icons";

export type HistoryType = "Water" | "Heart Rate" | "Blood Pressure" | "Symptom";

type Style = {
  Icon: ComponentType<{ className?: string }>;
  /** icon chip background */
  chipBg: string;
  /** icon + label text color */
  chipText: string;
  /** selected-row tint background (mobile select mode) */
  tint: string;
  /** selected-row border color (mobile select mode) */
  ring: string;
};

// Each type gets the same lightness/chroma as the app's blue accent, just a
// different hue - keeps the four colors visually related instead of clashing.
export const TYPE_STYLES: Record<HistoryType, Style> = {
  Water: {
    Icon: WaterIcon,
    chipBg: "bg-[oklch(58%_0.16_235/14%)] dark:bg-[oklch(58%_0.16_235/22%)]",
    chipText: "text-[oklch(46%_0.16_235)] dark:text-[oklch(80%_0.13_235)]",
    tint: "bg-[oklch(58%_0.16_235/6%)] dark:bg-[oklch(58%_0.16_235/12%)]",
    ring: "border-[oklch(58%_0.16_235/45%)] dark:border-[oklch(58%_0.16_235/50%)]",
  },
  "Heart Rate": {
    Icon: HeartIcon,
    chipBg: "bg-[oklch(58%_0.16_15/14%)] dark:bg-[oklch(58%_0.16_15/22%)]",
    chipText: "text-[oklch(46%_0.16_15)] dark:text-[oklch(80%_0.13_15)]",
    tint: "bg-[oklch(58%_0.16_15/6%)] dark:bg-[oklch(58%_0.16_15/12%)]",
    ring: "border-[oklch(58%_0.16_15/45%)] dark:border-[oklch(58%_0.16_15/50%)]",
  },
  "Blood Pressure": {
    Icon: PulseIcon,
    chipBg: "bg-[oklch(58%_0.16_300/14%)] dark:bg-[oklch(58%_0.16_300/22%)]",
    chipText: "text-[oklch(46%_0.16_300)] dark:text-[oklch(80%_0.13_300)]",
    tint: "bg-[oklch(58%_0.16_300/6%)] dark:bg-[oklch(58%_0.16_300/12%)]",
    ring: "border-[oklch(58%_0.16_300/45%)] dark:border-[oklch(58%_0.16_300/50%)]",
  },
  Symptom: {
    Icon: NoteIcon,
    chipBg: "bg-[oklch(58%_0.16_55/14%)] dark:bg-[oklch(58%_0.16_55/22%)]",
    chipText: "text-[oklch(46%_0.16_55)] dark:text-[oklch(80%_0.13_55)]",
    tint: "bg-[oklch(58%_0.16_55/6%)] dark:bg-[oklch(58%_0.16_55/12%)]",
    ring: "border-[oklch(58%_0.16_55/45%)] dark:border-[oklch(58%_0.16_55/50%)]",
  },
};

/** "Today" / "Yesterday" / weekday / full date, for grouping the mobile list. */
export function dayLabel(date: Date): string {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays < 7) return date.toLocaleDateString(undefined, { weekday: "long" });

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}
