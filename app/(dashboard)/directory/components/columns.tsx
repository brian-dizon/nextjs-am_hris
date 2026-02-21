"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, User, KeyRound, Mail } from "lucide-react";
import { User as PrismaUser } from "@/lib/generated/prisma";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<PrismaUser>[] = [
  {
    accessorKey: "name",
    sortingFn: (rowA, rowB) => {
      const nameA = String(rowA.original.name).toLowerCase();
      const nameB = String(rowB.original.name).toLowerCase();
      return nameA.localeCompare(nameB);
    },
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
      <div className="flex flex-col">
        <span className="font-semibold text-foreground capitalize">{row.getValue("name")}</span>
        <span className="text-xs text-muted-foreground">{row.original.email}</span>
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return (
        <span className={cn(
          "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium uppercase tracking-wider",
          role === "ADMIN" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {role}
        </span>
      );
    },
  },
  {
    accessorKey: "manager.name",
    id: "manager_name",
    header: "Reports To",
    cell: ({ row }) => {
      const managerName = (row.original as any).manager?.name;
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
    accessorKey: "requirePasswordChange",
    header: "Status",
    cell: ({ row }) => {
      const isPending = row.getValue("requirePasswordChange") as boolean;
      return (
        <span className={cn(
          "inline-flex items-center gap-1.5 text-xs font-medium",
          isPending ? "text-amber-600" : "text-emerald-600"
        )}>
          <div className={cn("h-1.5 w-1.5 rounded-full", isPending ? "bg-amber-600 animate-pulse" : "bg-emerald-600")} />
          {isPending ? "Setup Pending" : "Active"}
        </span>
      );
    },
  },
  {
    accessorKey: "joinedAt",
    header: "Joined",
    cell: ({ row }) => {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(new Date(row.getValue("joinedAt")));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return (
        <button
          onClick={() => {
            // We'll implement the actual reset call here later
            alert(`Reset password triggered for ${row.original.name}`);
          }}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground border border-transparent hover:border-border"
        >
          <KeyRound className="h-3 w-3" />
          Reset Pass
        </button>
      );
    },
  },
];
