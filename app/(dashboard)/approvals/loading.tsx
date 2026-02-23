import { Skeleton } from "@/components/ui/skeleton";

export default function ApprovalsLoading() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-4 w-[500px]" />
      </header>

      <div className="rounded-2xl border border-border bg-card">
        <div className="p-4 border-b border-border">
          <Skeleton className="h-10 w-full max-w-sm" />
        </div>
        <div className="p-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3 p-6 border-b border-border last:border-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-9 w-24 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
