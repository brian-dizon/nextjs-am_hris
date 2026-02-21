"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, User, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Define the shape of the data based on our unified server action
export type ApprovalRequest = {
  id: string;
  type: string; // "CORRECTION" | "MANUAL_ENTRY"
  reason: string;
  requestedStartTime: Date | null;
  requestedEndTime: Date | null;
  createdAt: Date;
  timeLog: {
    startTime: Date;
    endTime: Date | null;
    user: {
      name: string;
      email: string;
    };
  };
};

interface ColumnProps {
  onApprove: (id: string, type: string) => void;
  onReject: (id: string, type: string) => void;
}

const formatTime = (date: Date | null) => {
  if (!date) return "--:--";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }).format(new Date(date));
};

export const getColumns = ({ onApprove, onReject }: ColumnProps): ColumnDef<ApprovalRequest>[] => [
  {
    accessorKey: "timeLog.user.name",
    header: "Employee",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold text-foreground capitalize">{row.original.timeLog.user.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.timeLog.user.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Request Type",
    cell: ({ row }) => (
      <span className={cn(
        "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium uppercase tracking-wider",
        row.original.type === "CORRECTION" 
          ? "bg-amber-100 text-amber-700" 
          : "bg-blue-100 text-blue-700"
      )}>
        {row.original.type.replace("_", " ")}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Requested On",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(row.original.createdAt))}
      </span>
    ),
  },
  {
    id: "change",
    header: "Proposed Time",
    cell: ({ row }) => {
      const isManual = row.original.type === "MANUAL_ENTRY";
      const originalStart = row.original.timeLog.startTime;
      const originalEnd = row.original.timeLog.endTime;
      const newStart = row.original.requestedStartTime;
      const newEnd = row.original.requestedEndTime;

      if (isManual) {
        return (
          <div className="flex flex-col gap-1 text-sm">
             <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-8">In:</span>
              <span className="font-bold text-foreground">{formatTime(newStart)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-8">Out:</span>
              <span className="font-bold text-foreground">{formatTime(newEnd)}</span>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-8">In:</span>
            <span className={cn(newStart && "font-bold text-primary")}>
              {formatTime(newStart || originalStart)}
            </span>
            {newStart && <span className="text-xs text-muted-foreground line-through ml-1">{formatTime(originalStart)}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-8">Out:</span>
            <span className={cn(newEnd && "font-bold text-primary")}>
              {formatTime(newEnd || originalEnd)}
            </span>
            {newEnd && <span className="text-xs text-muted-foreground line-through ml-1">{formatTime(originalEnd)}</span>}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="text-sm italic text-muted-foreground max-w-[200px] block truncate" title={row.original.reason}>
        "{row.original.reason}"
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onApprove(row.original.id, row.original.type)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 hover:bg-emerald-200 transition-colors"
          title="Approve"
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          onClick={() => onReject(row.original.id, row.original.type)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
          title="Reject"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    ),
  },
];
