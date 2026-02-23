import { getCachedSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { 
  dehydrate, 
  HydrationBoundary, 
  QueryClient 
} from "@tanstack/react-query";
import { getStaffList, getManagers } from "@/lib/actions/staff-actions";
import DirectoryClient from "./directory-client";

export default async function DirectoryPage() {
  const session = await getCachedSession();

  const isAdminOrLeader = session?.user?.role === "ADMIN" || session?.user?.role === "LEADER";
  const isAdmin = session?.user?.role === "ADMIN";

  if (!session || !isAdminOrLeader) {
    redirect("/dashboard");
  }

  const queryClient = new QueryClient();

  // Prefetch critical directory data
  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ["staff-list"],
      queryFn: () => getStaffList(),
    }),
    queryClient.prefetchQuery({
      queryKey: ["managers-list"],
      queryFn: () => getManagers(),
    }),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DirectoryClient isAdminOrLeader={isAdminOrLeader} isAdmin={isAdmin} />
    </HydrationBoundary>
  );
}
