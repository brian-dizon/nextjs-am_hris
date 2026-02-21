"use client";

import { useQuery } from "@tanstack/react-query";
import { getTimeLogs } from "@/lib/actions/timer-actions";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Clock } from "lucide-react";

export default function TimesheetPage() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["time-logs"],
    queryFn: () => getTimeLogs(),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="h-96 w-full bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheet History</h1>
          <p className="text-muted-foreground">Detailed logs of your work hours and sessions.</p>
        </div>
      </header>

      {!logs || logs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No logs found</h3>
          <p className="text-muted-foreground">Completed shifts will appear here.</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={logs} 
          searchKey="type" 
          searchPlaceholder="Filter by WORK or BREAK..." 
        />
      )}
    </div>
  );
}
