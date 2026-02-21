"use client";

import { useQuery } from "@tanstack/react-query";
import { getStaffList } from "@/lib/actions/staff-actions";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { Users, UserPlus } from "lucide-react";
import { User as PrismaUser } from "@/lib/generated/prisma";
import { useState } from "react";
import AddStaffModal from "./components/add-staff-modal";

export default function DirectoryPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: staff, isLoading } = useQuery({
    queryKey: ["staff-list"],
    queryFn: () => getStaffList() as Promise<PrismaUser[]>,
  });

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
        columns={columns}
        data={staff || []}
        searchKey="name"
        searchPlaceholder="Search staff by name..."
      />

      <AddStaffModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
