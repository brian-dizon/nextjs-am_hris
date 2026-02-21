"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, User } from "lucide-react";
import { useEffect, useState } from "react";

// Types for the Admin Live Feed (includes joined user data)
export type AdminTimeLog = {
  id: string;
  startTime: Date;
  type: string;
  user: {
    name: string;
    image: string | null;
    email: string;
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
    <span className="font-mono font-bold text-primary animate-pulse">
      {hrs.toString().padStart(2, "0")}:{mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
    </span>
  );
};

export const columns: ColumnDef<AdminTimeLog>[] = [
  {
    accessorKey: "user.name",
    id: "user_name",
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
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{row.original.user.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.user.email}</span>
        </div>
      </div>
    ),
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
];
