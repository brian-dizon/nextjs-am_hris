"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getOrganizationActiveLogs, adminClockOut } from "@/lib/actions/timer-actions";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, type AdminTimeLog } from "./admin-live-feed-columns";
import { Users } from "lucide-react";
import { useMemo } from "react";

interface AdminLiveFeedProps {
  isAdmin: boolean;
}

export default function AdminLiveFeed({ isAdmin }: AdminLiveFeedProps) {
  const queryClient = useQueryClient();

  const { data: activeLogs, isLoading } = useQuery({
    queryKey: ["admin-active-logs"],
    queryFn: () => getOrganizationActiveLogs() as Promise<AdminTimeLog[]>,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const clockOutMutation = useMutation({
    mutationFn: (userId: string) => adminClockOut(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-active-logs"] });
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
    },
    onError: (error: any) => {
      alert(error.message);
    },
  });

  const handleClockOut = (userId: string, name: string) => {
    if (confirm(`Are you sure you want to force clock out ${name}?`)) {
      clockOutMutation.mutate(userId);
    }
  };

  const columns = useMemo(() => 
    getColumns({ isAdmin, onClockOut: handleClockOut }), 
  [isAdmin]);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="h-64 w-full bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Live Team Feed
          </h2>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-full">
          {activeLogs?.length || 0} Employees Active
        </span>
      </div>

      <DataTable
        columns={columns}
        data={activeLogs || []}
        searchKey="user_name"
        searchPlaceholder="Search employee name..."
      />
    </div>
  );
}
