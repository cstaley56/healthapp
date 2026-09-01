import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/NavBar";
import WaterCard from "@/components/WaterCard";
import HeartRateCard from "@/components/HeartRateCard";
import BloodPressureCard from "@/components/BloodPressureCard";
import SymptomCard from "@/components/SymptomCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  const [waterEntries, heartRateEntries, bpEntries, symptomEntries, symptomOptions] =
    await Promise.all([
      prisma.waterEntry.findMany({
        where: { userId },
        orderBy: { loggedAt: "desc" },
        take: 30,
      }),
      prisma.heartRateEntry.findMany({
        where: { userId },
        orderBy: { loggedAt: "desc" },
        take: 10,
      }),
      prisma.bloodPressureEntry.findMany({
        where: { userId },
        orderBy: { loggedAt: "desc" },
        take: 10,
      }),
      prisma.symptomEntry.findMany({
        where: { userId },
        orderBy: { loggedAt: "desc" },
        take: 15,
      }),
      prisma.symptomOption.findMany({
        where: { userId },
        orderBy: { lastUsedAt: "desc" },
        take: 50,
      }),
    ]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <NavBar userName={session.user.name ?? ""} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-8 text-2xl font-semibold tracking-tight">
          {greeting}, {session.user.name}
        </h1>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <WaterCard
            recentEntries={waterEntries.map((e) => ({
              id: e.id,
              amountOz: e.amountOz,
              loggedAt: e.loggedAt.toISOString(),
            }))}
          />
          <HeartRateCard
            recentEntries={heartRateEntries.map((e) => ({
              id: e.id,
              bpm: e.bpm,
              loggedAt: e.loggedAt.toISOString(),
            }))}
          />
          <BloodPressureCard
            recentEntries={bpEntries.map((e) => ({
              id: e.id,
              rawText: e.rawText,
              loggedAt: e.loggedAt.toISOString(),
            }))}
          />
          <SymptomCard
            recentEntries={symptomEntries.map((e) => ({
              id: e.id,
              text: e.text,
              loggedAt: e.loggedAt.toISOString(),
            }))}
            options={symptomOptions.map((o) => ({ id: o.id, label: o.label }))}
          />
        </div>
      </main>
    </>
  );
}
