"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { 
  History, 
  User as UserIcon, 
  Globe, 
  Terminal,
  Activity,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AuditLogEntry = {
  id: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  oldData: any;
  newData: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  user?: {
    image: string | null;
  } | null;
};

// Simple Badge fallback if Badge component is missing
const StatusBadge = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={cn("px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", className)}>
    {children}
  </span>
);

export const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "createdAt",
    header: "Timestamp",
    cell: ({ row }) => {
      return (
        <div className="flex flex-col gap-1 min-w-[140px]">
          <span className="text-sm font-bold text-foreground">
            {format(new Date(row.original.createdAt), "MMM d, h:mm a")}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <History className="h-3 w-3" />
            {format(new Date(row.original.createdAt), "yyyy-MM-dd")}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "userName",
    header: "Actor",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <UserIcon className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground capitalize">{row.original.userName}</span>
          <span className="text-[10px] text-muted-foreground">{row.original.userEmail}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action = row.original.action;
      const isUpdate = action.includes("UPDATE");
      const isDelete = action.includes("DELETE");
      const isCreate = action.includes("CREATE") || action.includes("ADD");

      return (
        <div className="flex items-center gap-2">
          <StatusBadge className={cn(
            isUpdate && "bg-blue-100 text-blue-700",
            isDelete && "bg-rose-100 text-rose-700",
            isCreate && "bg-emerald-100 text-emerald-700",
            !isUpdate && !isDelete && !isCreate && "bg-muted text-muted-foreground"
          )}>
            {action.replace(/_/g, " ")}
          </StatusBadge>
        </div>
      );
    },
  },
  {
    accessorKey: "entityType",
    header: "Target",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-foreground">{row.original.entityType}</span>
        <span className="text-[10px] font-mono text-muted-foreground truncate w-24">
          ID: {row.original.entityId || "N/A"}
        </span>
      </div>
    ),
  },
  {
    id: "changes",
    header: "Changes Captured",
    cell: ({ row }) => {
      const hasChanges = row.original.newData || row.original.oldData;
      if (!hasChanges) return <span className="text-[10px] text-muted-foreground">No data snapshots</span>;

      return (
        <div className="flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">State Recorded</span>
        </div>
      );
    },
  },
  {
    accessorKey: "ipAddress",
    header: "Network Info",
    cell: ({ row }) => (
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5">
          <Globe className="h-3 w-3" /> {row.original.ipAddress || "Unknown"}
        </span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-1.5 truncate w-32">
          <Terminal className="h-3 w-3" /> {row.original.userAgent || "Unknown"}
        </span>
      </div>
    ),
  },
];
