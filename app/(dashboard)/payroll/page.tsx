"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPayrollReport, type PayrollEntry } from "@/lib/actions/payroll-actions";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./components/columns";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DollarSign, Download, Loader2 } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DateRange } from "react-day-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";

export default function PayrollPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionLoading } = useSession();
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const isAdmin = session?.user?.role === "ADMIN";

  useEffect(() => {
    if (!isSessionLoading && !isAdmin) {
      router.push("/dashboard");
    }
  }, [isAdmin, isSessionLoading, router]);

  const { data: report, isLoading, isFetching, error, isError } = useQuery({
    queryKey: ["payroll-report", dateRange?.from, dateRange?.to],
    queryFn: () => getPayrollReport(dateRange!.from!, dateRange!.to!),
    enabled: !!dateRange?.from && !!dateRange?.to && isAdmin,
  });

  const handleExport = () => {
    toast.info("Export functionality (CSV/PDF) coming in Milestone 5.2!");
  };

  if (isSessionLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Payroll Log</h1>
          </div>
          <p className="text-muted-foreground">Calculate and review work hours for pay periods.</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker onRangeChange={setDateRange} />
          <button
            onClick={handleExport}
            className="flex h-10 items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold transition-all hover:bg-muted/80 border border-border"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </header>

      {isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive/50" />
          <h3 className="mt-4 text-lg font-semibold text-destructive">Error Loading Report</h3>
          <p className="text-destructive/80 text-sm mt-1">{(error as any)?.message || "An unexpected error occurred."}</p>
        </div>
      ) : isLoading ? (
        <div className="h-96 w-full animate-pulse bg-muted rounded-2xl" />
      ) : (
        <div className="relative">
          {isFetching && (
            <div className="absolute inset-0 z-10 bg-background/20 backdrop-blur-[1px] flex items-center justify-center rounded-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <DataTable
            columns={columns}
            data={report || []}
            searchKey="name"
            searchPlaceholder="Search staff name..."
          />
        </div>
      )}
    </div>
  );
}
