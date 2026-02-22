"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CalendarDays, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { LeaveRequest } from "@/lib/generated/prisma";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<LeaveRequest>[] = [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Leave Type
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => {
      const type = row.original.type;
      let typeStyle = "";

      switch (type) {
        case "VACATION":
          typeStyle = "bg-blue-100 text-blue-700 border-blue-200";
          break;
        case "SICK":
          typeStyle = "bg-amber-100 text-amber-700 border-amber-200";
          break;
        case "EARNED":
          typeStyle = "bg-emerald-100 text-emerald-700 border-emerald-200";
          break;
        case "EMERGENCY":
          typeStyle = "bg-red-100 text-red-700 border-red-200";
          break;
        default:
          typeStyle = "bg-muted text-muted-foreground border-border";
      }

      return (
        <span className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
          typeStyle
        )}>
          <TrendingUp className="h-3 w-3 mr-1" />
          {type}
        </span>
      );
    },
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start Date
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {format(new Date(row.original.startDate), "MMM dd, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "endDate",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        End Date
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {format(new Date(row.original.endDate), "MMM dd, yyyy")}
      </span>
    ),
  },
  {
    accessorKey: "netDays",
    header: "Net Days",
    cell: ({ row }) => (
      <span className="text-sm font-bold text-primary tabular-nums">
        {row.original.netDays}
      </span>
    ),
  },
  {
    accessorKey: "reason",
    header: "Reason",
    cell: ({ row }) => (
      <span className="text-sm italic text-muted-foreground max-w-[200px] block truncate" title={row.original.reason || "No reason provided"}>
        "{row.original.reason || "No reason provided"}"
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Status
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => {
      const status = row.original.status;
      let statusStyle = "";

      switch (status) {
        case "PENDING":
          statusStyle = "bg-amber-100 text-amber-700 border-amber-200";
          break;
        case "APPROVED":
          statusStyle = "bg-emerald-100 text-emerald-700 border-emerald-200";
          break;
        case "REJECTED":
          statusStyle = "bg-red-100 text-red-700 border-red-200";
          break;
        case "CANCELLED":
          statusStyle = "bg-gray-100 text-gray-700 border-gray-200";
          break;
        default:
          statusStyle = "bg-muted text-muted-foreground border-border";
      }

      return (
        <span className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
          statusStyle
        )}>
          {status}
        </span>
      );
    },
  },
  {
    accessorKey: "processedAt",
    header: "Processed On",
    cell: ({ row }) => {
      if (!row.original.processedAt) {
        return <span className="text-sm text-muted-foreground italic">N/A</span>;
      }
      return (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.processedAt), "MMM dd, yyyy")}
        </span>
      );
    },
  },
];
