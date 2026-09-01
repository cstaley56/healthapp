/** Collapse whitespace and lowercase, so "Headache", " headache ", "HEADACHE"
 *  all resolve to the same dropdown option and are searchable the same way. */
export function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Turn a free-typed blood pressure entry like "120/80" or "120 / 80 mmHg"
 *  into numeric systolic/diastolic when possible, without rejecting anything
 *  that doesn't match - the raw text is always kept as the source of truth. */
export function parseBloodPressure(rawText: string): {
  systolic: number | null;
  diastolic: number | null;
} {
  const match = rawText.match(/(\d{2,3})\s*\/\s*(\d{2,3})/);
  if (!match) return { systolic: null, diastolic: null };
  const systolic = parseInt(match[1], 10);
  const diastolic = parseInt(match[2], 10);
  if (Number.isNaN(systolic) || Number.isNaN(diastolic)) {
    return { systolic: null, diastolic: null };
  }
  return { systolic, diastolic };
}
