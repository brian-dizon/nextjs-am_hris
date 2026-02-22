"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, User, Check, X, CalendarDays, TrendingUp, HandCoins } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Define the shape of the data based on our unified server action
export type ApprovalRequest = {
  id: string;
  type: "CORRECTION" | "MANUAL_ENTRY" | "LEAVE_REQUEST"; // Add LEAVE_REQUEST
  reason: string;
  createdAt: Date;
  userId: string;
  userName: string;
  userEmail: string;

  // TimeLog specific fields
  requestedStartTime?: Date | null;
  requestedEndTime?: Date | null;
  timeLog?: {
    startTime: Date;
    endTime: Date | null;
  };

  // LeaveRequest specific fields
  startDate?: Date;
  endDate?: Date;
  leaveType?: string; // LeaveType enum
  netDays?: number;
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
    accessorKey: "userName",
    header: "Employee",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="font-semibold text-foreground capitalize">{row.original.userName}</span>
        <span className="text-xs text-muted-foreground">{row.original.userEmail}</span>
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Request Type",
    cell: ({ row }) => {
      const type = row.original.type;
      let typeStyle = "";
      let typeText = "";

      switch (type) {
        case "CORRECTION":
          typeStyle = "bg-amber-100 text-amber-700 border-amber-200";
          typeText = "Time Correction";
          break;
        case "MANUAL_ENTRY":
          typeStyle = "bg-blue-100 text-blue-700 border-blue-200";
          typeText = "Manual Entry";
          break;
        case "LEAVE_REQUEST":
          typeStyle = "bg-emerald-100 text-emerald-700 border-emerald-200";
          typeText = "Leave Request";
          break;
        default:
          typeStyle = "bg-muted text-muted-foreground border-border";
          typeText = "Unknown";
      }

      return (
        <span className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
          typeStyle
        )}>
          {typeText}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Requested On",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {format(new Date(row.original.createdAt), "MMM dd, hh:mm a")}
      </span>
    ),
  },
  {
    id: "details",
    header: "Details",
    cell: ({ row }) => {
      const { type, requestedStartTime, requestedEndTime, timeLog, startDate, endDate, netDays, leaveType } = row.original;

      if (type === "LEAVE_REQUEST") {
        return (
          <div className="flex flex-col gap-1 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-foreground capitalize">{leaveType?.toLowerCase()} Leave</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {format(new Date(startDate!), "MMM dd")} - {format(new Date(endDate!), "MMM dd, yyyy")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold text-primary">{netDays} Net Days</span>
            </div>
          </div>
        );
      }

      const originalStart = timeLog?.startTime;
      const originalEnd = timeLog?.endTime;
      const newStart = requestedStartTime;
      const newEnd = requestedEndTime;

      return (
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-8">In:</span>
            <span className={cn(newStart && "font-bold text-primary")}>
              {formatTime(newStart || originalStart || null)}
            </span>
            {newStart && <span className="text-xs text-muted-foreground line-through ml-1">{formatTime(originalStart || null)}</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground w-8">Out:</span>
            <span className={cn(newEnd && "font-bold text-primary")}>
              {formatTime(newEnd || originalEnd || null)}
            </span>
            {newEnd && <span className="text-xs text-muted-foreground line-through ml-1">{formatTime(originalEnd || null)}</span>}
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
        "{row.original.reason || "No reason provided"}"
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
