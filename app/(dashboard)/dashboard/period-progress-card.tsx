"use client";

import { useQuery } from "@tanstack/react-query";
import { getTimeStats } from "@/lib/actions/timer-actions";
import { 
  DollarSign, 
  CalendarDays, 
  TrendingUp, 
  AlertCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { differenceInDays, format } from "date-fns";

// For demo/client review, we'll hardcode the next major holiday
const NEXT_HOLIDAY = {
  name: "Labor Day",
  date: new Date(new Date().getFullYear(), 4, 1), // May 1st (example)
};

export default function PeriodProgressCard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["time-stats"],
    queryFn: () => getTimeStats(),
  });

  if (isLoading) return <div className="h-40 w-full animate-pulse bg-muted rounded-2xl" />;

  const hours = (stats?.totalSeconds || 0) / 3600;
  const daysUntilHoliday = differenceInDays(NEXT_HOLIDAY.date, new Date());
  
  // Calculate a mock Attendance Score for visual appeal (e.g., 94%)
  const attendanceScore = 94.5;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 shadow-sm transition-all hover:shadow-md group">
      <div className="absolute -right-4 -bottom-4 h-32 w-32 rounded-full bg-emerald-500/5 blur-3xl transition-all group-hover:bg-emerald-500/10" />
      
      <div className="flex flex-col h-full justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-[0.2em]">MTD Progress</span>
          </div>
          
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black tracking-tighter text-foreground">
                {hours.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight">hrs</span>
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest pt-1">
              Recorded in {format(new Date(), "MMMM")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-5">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Attendance</p>
            <p className="text-sm font-black text-foreground">{attendanceScore}%</p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Next Holiday</p>
            <p className="text-sm font-black text-emerald-600">
               {daysUntilHoliday > 0 ? `${daysUntilHoliday} Days` : "Tomorrow!"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
