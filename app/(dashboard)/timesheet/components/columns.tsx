"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, FileEdit } from "lucide-react";
import { TimeLog } from "@/lib/generated/prisma";
import { cn } from "@/lib/utils";

interface ColumnProps {
  onRequestCorrection: (log: TimeLog) => void;
}

export const getColumns = ({ onRequestCorrection }: ColumnProps): ColumnDef<TimeLog>[] => [
  {
    accessorKey: "startTime",
    header: ({ column }) => {
      return (
        <button
          className="flex items-center gap-2 hover:text-foreground transition-colors"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Date
          <ArrowUpDown className="h-4 w-4" />
        </button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("startTime"));
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    },
  },
  {
    accessorKey: "startTime_time",
    header: "Clock In",
    cell: ({ row }) => {
      const date = new Date(row.original.startTime);
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(date);
    },
  },
  {
    accessorKey: "endTime",
    header: "Clock Out",
    cell: ({ row }) => {
      const date = row.getValue("endTime");
      if (!date) return <span className="text-muted-foreground italic">--:--</span>;
      return new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      }).format(new Date(date as string));
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({ row }) => {
      const seconds = row.getValue("duration") as number | null;
      if (!seconds) return "0m";
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      return (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      
      const statusStyles = {
        APPROVED: "bg-emerald-100 text-emerald-700 border-emerald-200",
        PENDING: "bg-amber-100 text-amber-700 border-amber-200",
        REJECTED: "bg-rose-100 text-rose-700 border-rose-200",
      };

      const style = statusStyles[status as keyof typeof statusStyles] || "bg-muted text-muted-foreground";

      return (
        <span className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
          style
        )}>
          {status}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <button
          onClick={() => onRequestCorrection(row.original)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground border border-transparent hover:border-border"
        >
          <FileEdit className="h-3 w-3" />
          Correct
        </button>
      );
    },
  },
];
