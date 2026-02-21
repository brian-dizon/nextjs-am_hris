"use client";

import { useQuery } from "@tanstack/react-query";
import { getTimeLogs, getTimeStats } from "@/lib/actions/timer-actions";
import { DataTable } from "@/components/ui/data-table";
import { getColumns } from "./components/columns";
import { Clock, AlertCircle, CalendarDays, BarChart3 } from "lucide-react";
import { useState, useMemo } from "react";
import { TimeLog } from "@/lib/generated/prisma";
import CorrectionModal from "./components/correction-modal";
import AddEntryModal from "./components/add-entry-modal";
import { Plus } from "lucide-react";

export default function TimesheetPage() {
  const [selectedLog, setSelectedLog] = useState<TimeLog | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: logs, isLoading: isLoadingLogs } = useQuery({
    queryKey: ["time-logs"],
    queryFn: () => getTimeLogs(),
  });

  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["time-stats"],
    queryFn: () => getTimeStats(),
  });

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  const columns = useMemo(() => getColumns({ onRequestCorrection: setSelectedLog }), []);

  if (isLoadingLogs || isLoadingStats) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-muted rounded-xl" />)}
        </div>
        <div className="h-96 w-full bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timesheet History</h1>
          <p className="text-muted-foreground">Detailed logs of your work hours and sessions.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </button>
      </header>

      {/* Stats Header */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Hours (Month)</p>
            <p className="text-2xl font-bold tracking-tight">{formatDuration(stats?.totalSeconds || 0)}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Pending Corrections</p>
            <p className="text-2xl font-bold tracking-tight">{stats?.pendingCorrections || 0}</p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Logs Recorded</p>
            <p className="text-2xl font-bold tracking-tight">{logs?.length || 0}</p>
          </div>
        </div>
      </div>

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

      <CorrectionModal 
        log={selectedLog} 
        onClose={() => setSelectedLog(null)} 
      />

      <AddEntryModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
      />
    </div>
  );
}
