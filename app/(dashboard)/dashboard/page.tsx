import TimerCard from "@/components/timer-card";
import AdminLiveFeed from "@/components/admin-live-feed";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import WeeklySummary from "./weekly-summary";
import DailyPulseCard from "./daily-pulse-card";
import PeriodProgressCard from "./period-progress-card";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isAdmin = session?.user.role === "ADMIN" || session?.user.role === "LEADER";

  return (
    <div className="space-y-10 pb-10">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-lg">
          Welcome, {session?.user.name}. Here is your current overview.
        </p>
      </header>

      {/* Primary Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <TimerCard />

        <DailyPulseCard userName={session?.user.name || "Staff Member"} />

        <PeriodProgressCard />
      </div>

      {/* Admin Monitoring Layer */}
      {isAdmin && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminLiveFeed isAdmin={isAdmin} />
        </section>
      )}

      {/* Personal Activity Layer (Weekly Summary) */}
      <section className="animate-in fade-in slide-in-from-bottom-4 delay-150 duration-700">
        <WeeklySummary />
      </section>
    </div>
  );
}
