"use client";

import { useQuery } from "@tanstack/react-query";
import { getStaffList, deleteStaff } from "@/lib/actions/staff-actions";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Users, UserPlus, KeyRound, Trash2 } from "lucide-react";
import { User as PrismaUser } from "@/lib/generated/prisma";
import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import AddStaffModal from "./components/add-staff-modal";
import ResetPasswordModal from "./components/reset-password-modal";

export default function DirectoryPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string } | null>(null);

  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => getStaffList() as Promise<PrismaUser[]>,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
    },
    onError: (error: any) => {
      alert(error.message);
    },
  });

  // Dynamically update columns to include the modal trigger and delete action
  const tableColumns = useMemo(() => {
    return columns.map((col) => {
      if (col.id === "actions") {
        return {
          ...col,
          cell: ({ row }: any) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedUser({ id: row.original.id, name: row.original.name })}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground border border-transparent hover:border-border"
              >
                <KeyRound className="h-3 w-3" />
                Reset Pass
              </button>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${row.original.name}?`)) {
                    deleteMutation.mutate(row.original.id);
                  }
                }}
                className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-destructive transition-all hover:bg-destructive/10 border border-transparent hover:border-destructive/20"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          ),
        };
      }
      return col;
    });
  }, [deleteMutation]);

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
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Employee Directory</h1>
          <p className="text-muted-foreground mt-1">Manage and view all staff members in your organization.</p>
        </div>
        <button 
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90"
          onClick={() => setIsModalOpen(true)}
        >
          <UserPlus className="h-4 w-4" />
          Add Employee
        </button>
      </header>

      <DataTable
        columns={tableColumns as any}
        data={staff || []}
        searchKey="name"
        searchPlaceholder="Search staff by name..."
      />

      <AddStaffModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

      <ResetPasswordModal 
        user={selectedUser} 
        onClose={() => setSelectedUser(null)} 
      />
    </div>
  );
}
