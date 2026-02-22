import TimerCard from "@/components/timer-card";
import AdminLiveFeed from "@/components/admin-live-feed";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import QuickActionsCard from "./quick-actions-card";

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

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold text-lg">Leave Credits</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Vacation</span>
              <span className="font-medium text-primary">-- days</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="text-muted-foreground">Sick Leave</span>
              <span className="font-medium text-primary">-- days</span>
            </div>
          </div>
        </div>

        <QuickActionsCard />
      </div>

      {/* Admin Monitoring Layer */}
      {isAdmin && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <AdminLiveFeed isAdmin={isAdmin} />
        </section>
      )}
    </div>
  );
}
