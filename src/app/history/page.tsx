import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/NavBar";
import HistoryTable, { type HistoryRow } from "@/components/HistoryTable";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [water, heartRate, bloodPressure, symptoms] = await Promise.all([
    prisma.waterEntry.findMany({ where: { userId }, orderBy: { loggedAt: "desc" }, take: 1000 }),
    prisma.heartRateEntry.findMany({ where: { userId }, orderBy: { loggedAt: "desc" }, take: 1000 }),
    prisma.bloodPressureEntry.findMany({ where: { userId }, orderBy: { loggedAt: "desc" }, take: 1000 }),
    prisma.symptomEntry.findMany({ where: { userId }, orderBy: { loggedAt: "desc" }, take: 1000 }),
  ]);

  const rows: HistoryRow[] = [
    ...water.map((e) => ({
      id: `water-${e.id}`,
      rawId: e.id,
      entryType: "water" as const,
      type: "Water" as const,
      summary: `${e.amountOz} oz`,
      loggedAt: e.loggedAt.toISOString(),
    })),
    ...heartRate.map((e) => ({
      id: `hr-${e.id}`,
      rawId: e.id,
      entryType: "heartrate" as const,
      type: "Heart Rate" as const,
      summary: `${e.bpm} bpm`,
      loggedAt: e.loggedAt.toISOString(),
    })),
    ...bloodPressure.map((e) => ({
      id: `bp-${e.id}`,
      rawId: e.id,
      entryType: "bloodpressure" as const,
      type: "Blood Pressure" as const,
      summary: e.rawText,
      loggedAt: e.loggedAt.toISOString(),
    })),
    ...symptoms.map((e) => ({
      id: `sym-${e.id}`,
      rawId: e.id,
      entryType: "symptom" as const,
      type: "Symptom" as const,
      summary: e.text,
      loggedAt: e.loggedAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime());

  return (
    <>
      <NavBar userName={session.user.name ?? ""} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight">History</h1>
        <p className="mb-8 text-black/50 dark:text-white/50">
          Every entry you&apos;ve logged, searchable and ready to share with a provider.
        </p>
        <HistoryTable rows={rows} />
      </main>
    </>
  );
}
