"use client";

import { useQuery } from "@tanstack/react-query";
import { getWeeklyTimeLogs } from "@/lib/actions/timer-actions";
import { 
  format, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  isToday,
  isWeekend
} from "date-fns";
import { Clock, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS_OF_WEEK = [1, 2, 3, 4, 5, 6, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun

export default function WeeklySummary() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["weekly-time-logs"],
    queryFn: () => getWeeklyTimeLogs(),
  });

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  if (isLoading) {
    return <div className="h-64 w-full animate-pulse bg-muted rounded-2xl" />;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Clock className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground">Weekly Timecard</h3>
        </div>
        <span className="text-[10px] font-bold text-muted-foreground uppercase bg-muted px-2 py-1 rounded-md">
          Starts Mon, {format(weekStart, "MMM d")}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
        {DAYS_OF_WEEK.map((dayOffset, index) => {
          const date = addDays(weekStart, index);
          const dayLogs = logs?.filter(log => isSameDay(new Date(log.startTime), date)) || [];
          
          const totalSeconds = dayLogs.reduce((acc, log) => {
            if (log.status === "APPROVED" && log.duration) return acc + log.duration;
            return acc;
          }, 0);
          
          const hours = totalSeconds / 3600;
          const isComplete = hours >= 8;
          const isCurrentDay = isToday(date);
          const isWeekendDay = isWeekend(date);

          return (
            <div 
              key={index} 
              className={cn(
                "group relative rounded-2xl border p-5 transition-all duration-200",
                isCurrentDay 
                  ? "border-primary bg-primary/5 shadow-sm scale-[1.02] z-10" 
                  : "border-border bg-card hover:border-primary/20",
                isWeekendDay && !isCurrentDay && "opacity-60 bg-muted/30"
              )}
            >
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isCurrentDay ? "text-primary" : "text-muted-foreground"
                    )}>
                      {format(date, "EEE")}
                    </span>
                    <span className="text-sm font-extrabold text-foreground">
                      {format(date, "d")}
                    </span>
                  </div>
                  {isComplete ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : hours > 0 ? (
                    <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  ) : null}
                </div>

                <div className="space-y-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black tracking-tighter text-foreground">
                      {hours.toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">hrs</span>
                  </div>
                  
                  {/* Miniature Progress Bar */}
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        isComplete ? "bg-emerald-500" : "bg-primary"
                      )}
                      style={{ width: `${Math.min((hours / 8) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                   {dayLogs.some(l => l.type === "LEAVE") && (
                     <span className="text-[8px] font-bold uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm">Leave</span>
                   )}
                   {dayLogs.some(l => l.isManual && l.type !== "LEAVE") && (
                     <span className="text-[8px] font-bold uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm">Manual</span>
                   )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
