"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPendingCorrections, approveCorrection, rejectCorrection } from "@/lib/actions/approval-actions";
import { DataTable } from "@/components/ui/data-table";
import { getColumns, type ApprovalRequest } from "./components/columns";
import { CheckSquare } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  const isAdminOrLeader = session?.user?.role === "ADMIN" || session?.user?.role === "LEADER";

  useEffect(() => {
    if (!isSessionLoading && !isAdminOrLeader) {
      router.push("/dashboard");
    }
  }, [isAdminOrLeader, isSessionLoading, router]);

  const { data: requests, isLoading } = useQuery({
    queryKey: ["pending-approvals"],
    queryFn: () => getPendingCorrections() as Promise<ApprovalRequest[]>,
    enabled: isAdminOrLeader,
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => approveCorrection(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Request approved successfully.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: string }) => rejectCorrection(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] });
      toast.success("Request rejected.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const columns = useMemo(() => getColumns({
    onApprove: (id, type) => approveMutation.mutate({ id, type }),
    onReject: (id, type) => rejectMutation.mutate({ id, type }),
  }), []);

  if (isLoading || isSessionLoading) {
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
        <p className="text-muted-foreground mt-1">Review and process time correction requests from your team.</p>
      </header>

      {!requests || requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <CheckSquare className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold">All caught up!</h3>
          <p className="text-muted-foreground">No pending correction requests found.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={requests}
          searchKey="timeLog_user_name" // Nested search key for TanStack (requires flattening or custom filter)
          searchPlaceholder="Search employee..."
        />
      )}
    </div>
  );
}
