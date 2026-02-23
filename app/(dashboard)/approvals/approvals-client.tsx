"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingApprovals, approveRequest, rejectRequest } from "@/lib/actions/approval-actions";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, type ApprovalRequest } from "./components/columns";
import { CheckSquare } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

export default function ApprovalsClient({ isAdminOrLeader }: { isAdminOrLeader: boolean }) {
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: () => getPendingApprovals() as Promise<ApprovalRequest[]>,
    enabled: isAdminOrLeader,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => approveRequest(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Request approved successfully.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => rejectRequest(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Request rejected.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const columns = useMemo(() => getColumns({
    onApprove: (id, type) => approveMutation.mutate({ id, type }),
    onReject: (id, type) => rejectMutation.mutate({ id, type }),
  }), [approveMutation, rejectMutation]);

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="h-96 w-full bg-muted rounded-2xl" />
      </div>
    );
  }

  if (!isAdminOrLeader) return null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Pending Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and process time correction, manual entry, and leave requests from your team.</p>
      </header>

      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
          <p className="text-muted-foreground">No pending requests found.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          searchKey="userName"
          searchPlaceholder="Search employee..."
        />
      )}
    </div>
  );
}
