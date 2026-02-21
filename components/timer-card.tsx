"use client";

import { useTimer } from "@/hooks/use-timer";
import { Clock, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TimerCard() {
  const {
    activeLog,
    isLoading,
    formattedTime,
    isClockingIn,
    isClockingOut,
    handleClockIn,
    handleClockOut,
  } = useTimer();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="h-12 w-full bg-muted rounded-xl" />
      </div>
    );
  }

  const isClockedIn = !!activeLog && !activeLog.endTime;

  return (
    <div className={cn(
      "rounded-2xl border p-6 shadow-sm transition-all duration-500",
      isClockedIn ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20" : "border-border bg-card"
    )}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Clock className={cn("h-5 w-5", isClockedIn ? "text-primary animate-pulse" : "text-muted-foreground")} />
          Active Timer
        </h2>
        {isClockedIn && (
          <span className="text-xs font-bold uppercase tracking-wider text-primary px-2 py-1 bg-primary/10 rounded-full">
            On the Clock
          </span>
        )}
      </div>

      <div className="text-center py-4">
        <span className={cn(
          "text-5xl font-bold tabular-nums tracking-tighter",
          isClockedIn ? "text-foreground" : "text-muted-foreground/50"
        )}>
          {formattedTime}
        </span>
      </div>

      <div className="mt-6">
        {!isClockedIn ? (
          <button
            onClick={handleClockIn}
            disabled={isClockingIn}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Play className="h-4 w-4 fill-current" />
            {isClockingIn ? "Clocking In..." : "Clock In"}
          </button>
        ) : (
          <button
            onClick={handleClockOut}
            disabled={isClockingOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-destructive px-4 py-3 text-sm font-semibold text-destructive-foreground shadow-md transition-all hover:bg-destructive/90 disabled:opacity-50"
          >
            <Square className="h-4 w-4 fill-current" />
            {isClockingOut ? "Clocking Out..." : "Clock Out"}
          </button>
        )}
      </div>
    </div>
  );
}
