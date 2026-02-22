"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaveRequests } from "@/lib/actions/leave-actions";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { CalendarClock, Loader2 } from "lucide-react";
import { LeaveRequest } from "@/lib/generated/prisma";

export default function LeavePage() {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["my-leave-requests"],
    queryFn: () => getLeaveRequests() as Promise<LeaveRequest[]>,
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
      <header>
        <div className="flex items-center gap-2 mb-1">
          <CalendarClock className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight text-foreground">My Leave History</h1>
        </div>
        <p className="text-muted-foreground mt-1">Review your past leave applications and their current status.</p>
      </header>

      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <CalendarClock className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">No leave requests found</h3>
          <p className="text-muted-foreground">Apply for leave using the button on your profile or dashboard.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          searchKey="type"
          searchPlaceholder="Filter by leave type (Vacation, Sick, etc.)..."
        />
      )}
    </div>
  );
}
