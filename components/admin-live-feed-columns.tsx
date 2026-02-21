"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Square } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Types for the Admin Live Feed (includes joined user data)
export type AdminTimeLog = {
  id: string;
  userId: string;
  startTime: Date;
  type: string;
  user: {
    name: string;
    image: string | null;
    email: string;
    manager?: {
      name: string;
    } | null;
  };
};

// Sub-component for the ticking duration cell
const LiveDuration = ({ startTime }: { startTime: Date }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const diff = Math.floor((now.getTime() - new Date(startTime).getTime()) / 1000);
  const hrs = Math.floor(diff / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  const secs = diff % 60;

  return (
    <span className="font-mono font-bold text-primary animate-pulse text-sm">
      {hrs.toString().padStart(2, "0")}:{mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
    </span>
  );
};

interface ColumnProps {
  isAdmin: boolean;
  onClockOut: (userId: string, name: string) => void;
}

export const getColumns = ({ isAdmin, onClockOut }: ColumnProps): ColumnDef<AdminTimeLog>[] => [
  {
    accessorKey: "user.name",
    id: "user_name",
    sortingFn: (rowA, rowB) => {
      const nameA = String(rowA.original.user.name).toLowerCase();
      const nameB = String(rowB.original.user.name).toLowerCase();
      return nameA.localeCompare(nameB);
    },
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Employee
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => (
      <div className="flex flex-col text-left">
        <span className="font-semibold text-foreground capitalize">{row.original.user.name}</span>
        <span className="text-xs text-muted-foreground">{row.original.user.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "user.manager.name",
    id: "manager_name",
    header: ({ column }) => (
      <button
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Reports To
        <ArrowUpDown className="h-4 w-4" />
      </button>
    ),
    cell: ({ row }) => {
      const managerName = row.original.user.manager?.name;
      return (
        <span className={cn(
          "text-sm font-medium",
          managerName ? "text-foreground capitalize" : "text-muted-foreground italic"
        )}>
          {managerName || "None"}
        </span>
      );
    },
  },
  {
    accessorKey: "startTime",
    header: "Clock In",
    cell: ({ row }) => {
      const date = new Date(row.getValue("startTime"));
      return (
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "numeric",
              hour12: true,
            }).format(date)}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Intl.DateTimeFormat("en-US", {
              month: "short",
              day: "numeric",
            }).format(date)}
          </span>
        </div>
      );
    },
  },
  {
    id: "duration",
    header: "Live Duration",
    cell: ({ row }) => <LiveDuration startTime={row.original.startTime} />,
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {row.getValue("type")}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      if (!isAdmin) return null;
      return (
        <button
          onClick={() => onClockOut(row.original.userId, row.original.user.name)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-destructive transition-all hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
        >
          <Square className="h-3 w-3 fill-current" />
          Clock Out
        </button>
      );
    },
  },
];
