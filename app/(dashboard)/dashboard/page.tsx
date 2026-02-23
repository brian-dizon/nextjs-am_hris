import TimerCard from "@/components/timer-card";
import AdminLiveFeed from "@/components/admin-live-feed";
import { getCachedSession } from "@/lib/auth";
import WeeklySummary from "./weekly-summary";
import DailyPulseCard from "./daily-pulse-card";
import PeriodProgressCard from "./period-progress-card";
import { 
  dehydrate, 
  HydrationBoundary, 
  QueryClient 
} from "@tanstack/react-query";
import { 
  getActiveTimeLog, 
  getTimeStats, 
  getWeeklyTimeLogs,
  getOrganizationActiveLogs
} from "@/lib/actions/timer-actions";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default async function DashboardPage() {
  const session = await getCachedSession();
  const queryClient = new QueryClient();
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "LEADER";

  // Prefetch CRITICAL data only (Blocking for LCP)
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["active-timer"],
      queryFn: () => getActiveTimeLog(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["time-stats"],
      queryFn: () => getTimeStats(),
    }),
  ]);

  // Start non-blocking prefetch for secondary components
  queryClient.prefetchQuery({
    queryKey: ["weekly-time-logs"],
    queryFn: () => getWeeklyTimeLogs(),
  });

  if (isAdmin) {
    queryClient.prefetchQuery({
      queryKey: ["admin-active-logs"],
      queryFn: () => getOrganizationActiveLogs(),
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
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

        {/* Admin Monitoring Layer - Suspended */}
        {isAdmin && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Suspense fallback={
              <div className="space-y-4">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-[400px] w-full rounded-2xl" />
              </div>
            }>
              <AdminLiveFeed isAdmin={isAdmin} />
            </Suspense>
          </section>
        )}

        {/* Personal Activity Layer - Suspended */}
        <section className="animate-in fade-in slide-in-from-bottom-4 delay-150 duration-700">
          <Suspense fallback={
            <div className="space-y-6">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
                {[...Array(7)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </div>
            </div>
          }>
            <WeeklySummary />
          </Suspense>
        </section>
      </div>
    </HydrationBoundary>
  );
}
