"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeText, parseBloodPressure } from "@/lib/normalize";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return session?.user?.id ?? null;
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/history");
}

export async function addWaterEntry(amountOz: number): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  if (!Number.isFinite(amountOz) || amountOz <= 0 || amountOz > 500) {
    return { ok: false, error: "Enter an amount between 1 and 500 oz." };
  }

  await prisma.waterEntry.create({
    data: { userId, amountOz: Math.round(amountOz) },
  });
  refresh();
  return { ok: true };
}

export async function addHeartRateEntry(bpm: number): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  if (!Number.isInteger(bpm) || bpm < 40 || bpm > 250) {
    return { ok: false, error: "Heart rate must be between 40 and 250 bpm." };
  }

  await prisma.heartRateEntry.create({ data: { userId, bpm } });
  refresh();
  return { ok: true };
}

export async function addBloodPressureEntry(rawText: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const trimmed = rawText.trim();
  if (!trimmed) return { ok: false, error: "Enter a blood pressure reading." };
  if (trimmed.length > 100) return { ok: false, error: "That reading is too long." };

  const { systolic, diastolic } = parseBloodPressure(trimmed);

  await prisma.bloodPressureEntry.create({
    data: { userId, rawText: trimmed, systolic, diastolic },
  });
  refresh();
  return { ok: true };
}

export async function addSymptomEntry(text: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: "Enter or choose a symptom." };
  if (trimmed.length > 300) return { ok: false, error: "That's a bit long - try to keep it under 300 characters." };

  const normalized = normalizeText(trimmed);

  const option = await prisma.symptomOption.upsert({
    where: { userId_normalizedLabel: { userId, normalizedLabel: normalized } },
    update: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    create: { userId, label: trimmed, normalizedLabel: normalized },
  });

  await prisma.symptomEntry.create({
    data: {
      userId,
      optionId: option.id,
      text: trimmed,
      normalizedText: normalized,
    },
  });

  refresh();
  return { ok: true };
}

export type EntryType = "water" | "heartrate" | "bloodpressure" | "symptom";

export async function deleteEntry(type: EntryType, id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  if (!id) return { ok: false, error: "Missing entry." };

  // deleteMany (instead of delete) scoped to both id AND userId means someone
  // can never delete another person's entry, even by guessing/crafting an id.
  let count = 0;
  switch (type) {
    case "water":
      ({ count } = await prisma.waterEntry.deleteMany({ where: { id, userId } }));
      break;
    case "heartrate":
      ({ count } = await prisma.heartRateEntry.deleteMany({ where: { id, userId } }));
      break;
    case "bloodpressure":
      ({ count } = await prisma.bloodPressureEntry.deleteMany({ where: { id, userId } }));
      break;
    case "symptom":
      ({ count } = await prisma.symptomEntry.deleteMany({ where: { id, userId } }));
      break;
  }

  if (count === 0) return { ok: false, error: "That entry is gone already." };

  refresh();
  return { ok: true };
}

// Bulk version for the History tab's multi-select "Delete Selected" action.
// One transaction, one revalidate, instead of N separate round trips.
export async function deleteEntries(items: { type: EntryType; id: string }[]): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not signed in." };
  if (items.length === 0) return { ok: false, error: "Nothing selected." };

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      switch (item.type) {
        case "water":
          await tx.waterEntry.deleteMany({ where: { id: item.id, userId } });
          break;
        case "heartrate":
          await tx.heartRateEntry.deleteMany({ where: { id: item.id, userId } });
          break;
        case "bloodpressure":
          await tx.bloodPressureEntry.deleteMany({ where: { id: item.id, userId } });
          break;
        case "symptom":
          await tx.symptomEntry.deleteMany({ where: { id: item.id, userId } });
          break;
      }
    }
  });

  refresh();
  return { ok: true };
}

// Used by the "+ Add" dialog on the History tab, for logging something after
// the fact (e.g. you forgot to record a symptom at the time it happened).
// Any combination of the four fields can be present; all of them share the
// one loggedAt timestamp the person picked in the dialog.
export type RetroactiveInput = {
  loggedAt: string; // ISO string
  water?: { amountOz: number };
  heartRate?: { bpm: number };
  bloodPressure?: { rawText: string };
  symptom?: { text: string };
};

export async function addRetroactiveEntries(input: RetroactiveInput): Promise<ActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "Not signed in." };

  if (!input.water && !input.heartRate && !input.bloodPressure && !input.symptom) {
    return { ok: false, error: "Choose at least one thing to add." };
  }

  const loggedAt = new Date(input.loggedAt);
  if (Number.isNaN(loggedAt.getTime())) {
    return { ok: false, error: "Enter a valid date and time." };
  }
  if (loggedAt.getTime() > Date.now() + 5 * 60 * 1000) {
    return { ok: false, error: "Date and time can't be in the future." };
  }

  if (input.water) {
    const { amountOz } = input.water;
    if (!Number.isFinite(amountOz) || amountOz <= 0 || amountOz > 500) {
      return { ok: false, error: "Water amount must be between 1 and 500 oz." };
    }
  }
  if (input.heartRate) {
    const { bpm } = input.heartRate;
    if (!Number.isInteger(bpm) || bpm < 40 || bpm > 250) {
      return { ok: false, error: "Heart rate must be between 40 and 250 bpm." };
    }
  }
  let bpTrimmed = "";
  if (input.bloodPressure) {
    bpTrimmed = input.bloodPressure.rawText.trim();
    if (!bpTrimmed) return { ok: false, error: "Enter a blood pressure reading." };
    if (bpTrimmed.length > 100) return { ok: false, error: "That blood pressure reading is too long." };
  }
  let symptomTrimmed = "";
  if (input.symptom) {
    symptomTrimmed = input.symptom.text.trim();
    if (!symptomTrimmed) return { ok: false, error: "Choose or type a symptom." };
    if (symptomTrimmed.length > 300) {
      return { ok: false, error: "That symptom is a bit long - try to keep it under 300 characters." };
    }
  }

  await prisma.$transaction(async (tx) => {
    if (input.water) {
      await tx.waterEntry.create({
        data: { userId, amountOz: Math.round(input.water!.amountOz), loggedAt },
      });
    }
    if (input.heartRate) {
      await tx.heartRateEntry.create({ data: { userId, bpm: input.heartRate!.bpm, loggedAt } });
    }
    if (input.bloodPressure) {
      const { systolic, diastolic } = parseBloodPressure(bpTrimmed);
      await tx.bloodPressureEntry.create({
        data: { userId, rawText: bpTrimmed, systolic, diastolic, loggedAt },
      });
    }
    if (input.symptom) {
      const normalized = normalizeText(symptomTrimmed);
      const option = await tx.symptomOption.upsert({
        where: { userId_normalizedLabel: { userId, normalizedLabel: normalized } },
        update: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
        create: { userId, label: symptomTrimmed, normalizedLabel: normalized },
      });
      await tx.symptomEntry.create({
        data: { userId, optionId: option.id, text: symptomTrimmed, normalizedText: normalized, loggedAt },
      });
    }
  });

  refresh();
  return { ok: true };
}
