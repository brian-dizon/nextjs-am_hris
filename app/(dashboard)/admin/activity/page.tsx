"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuditLogs } from "@/lib/actions/audit-actions";
import { DataTable } from "@/components/ui/data-table";
import { columns, type AuditLogEntry } from "./components/columns";
import { 
  ShieldCheck, 
  Search, 
  Activity, 
  FileText, 
  RefreshCcw,
  AlertCircle 
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export default function AuditActivityPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isSessionLoading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, isSessionLoading, router]);

  const { data: logs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: () => getAuditLogs() as Promise<AuditLogEntry[]>,
    enabled: isAdmin,
  });

  if (isLoading || isSessionLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
        <div className="h-20 w-full bg-muted rounded-3xl" />
        <div className="h-96 w-full bg-muted rounded-3xl" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 px-1">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Admin Console</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground leading-none">Activity Log</h1>
          <p className="text-muted-foreground font-medium">Real-time system actions and administrative oversight.</p>
        </div>

        <div className="flex items-center gap-3">
           <button 
            onClick={() => {
              refetch();
              toast.info("Updating activity feed...");
            }}
            disabled={isRefetching}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-all hover:bg-muted active:scale-95 disabled:opacity-50"
          >
            <RefreshCcw className={isRefetching ? "animate-spin h-4 w-4" : "h-4 w-4"} />
            Refresh Feed
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: "Total Actions", value: logs?.length || 0, icon: Activity, color: "text-blue-500", bg: "bg-blue-100" },
          { label: "Entities Tracked", value: new Set(logs?.map(l => l.entityType)).size || 0, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-100" },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {!logs || logs.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-border bg-card p-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground/30 mb-6" />
          <h3 className="text-xl font-bold text-foreground tracking-tight">No activity logs yet.</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2">Any administrative actions will appear here for audit purposes.</p>
        </div>
      ) : (
        <div className="rounded-[2rem] border border-border bg-card overflow-hidden shadow-sm">
          <DataTable
            columns={columns}
            data={logs}
            searchKey="userName"
            searchPlaceholder="Filter by actor (name)..."
          />
        </div>
      )}
    </div>
  );
}
