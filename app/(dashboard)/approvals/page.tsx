import { getCachedSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  dehydrate, 
  HydrationBoundary, 
  QueryClient 
} from "@tanstack/react-query";
import { getPendingApprovals } from "@/lib/actions/approval-actions";
import ApprovalsClient from "./approvals-client";

export default async function ApprovalsPage() {
  const session = await getCachedSession();

  const isAdminOrLeader = session?.user?.role === "ADMIN" || session?.user?.role === "LEADER";

  if (!session || !isAdminOrLeader) {
    redirect("/dashboard");
  }

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["pending-approvals"],
    queryFn: () => getPendingApprovals(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ApprovalsClient isAdminOrLeader={isAdminOrLeader} />
    </HydrationBoundary>
  );
}
