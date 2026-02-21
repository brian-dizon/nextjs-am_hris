"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertCircle, CheckCircle2 } from "lucide-react";
import { PayrollEntry } from "@/lib/actions/payroll-actions";
import { cn } from "@/lib/utils";

const formatDuration = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hrs}h ${mins}m`;
};

export const columns: ColumnDef<PayrollEntry>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Staff Member
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col text-left">
        <span className="font-semibold text-foreground capitalize">{row.original.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "managerName",
    header: "Reports To",
    cell: ({ row }) => {
      const managerName = row.original.managerName;
      return (
        <span className={cn(
          "text-sm font-medium capitalize",
          managerName ? "text-foreground" : "text-muted-foreground italic"
        )}>
          {managerName || "None"}
        </span>
      );
    },
  },
  {
    accessorKey: "autoSeconds",
    header: "Auto Hours",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground tabular-nums">
        {formatDuration(row.original.autoSeconds)}
      </span>
    ),
  },
  {
    accessorKey: "manualSeconds",
    header: "Manual Entry",
    cell: ({ row }) => (
      <span className={cn(
        "text-sm tabular-nums",
        row.original.manualSeconds > 0 ? "text-amber-600 font-medium" : "text-muted-foreground"
      )}>
        {formatDuration(row.original.manualSeconds)}
      </span>
    ),
  },
  {
    accessorKey: "totalSeconds",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total Hours
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-lg font-bold tabular-nums">
        {formatDuration(row.original.totalSeconds)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
          status === "READY" 
            ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
            : "bg-amber-100 text-amber-700 border-amber-200"
        )}>
          {status === "READY" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <AlertCircle className="h-3 w-3" />
          )}
          {status}
        </span>
      );
    },
  },
];
