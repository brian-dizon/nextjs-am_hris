"use client";

import { useQuery } from "@tanstack/react-query";
import { getTimeLogs } from "@/lib/actions/timer-actions";
import { Clock, Calendar, ArrowRightLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimesheetPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["time-logs"],
    queryFn: () => getTimeLogs(),
  });

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0m";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 w-full bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Timesheet History</h1>
        <p className="text-muted-foreground">Detailed logs of your work hours and sessions.</p>
      </header>

      <div className="space-y-4">
        {!logs || logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
            <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
            <p className="text-muted-foreground">Completed shifts will appear here.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{formatDate(log.startTime)}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatTime(log.startTime)}</span>
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>{log.endTime ? formatTime(log.endTime) : "--:--"}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-foreground">
                  {formatDuration(log.duration)}
                </p>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {log.type}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
