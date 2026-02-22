import { format } from "date-fns";
import { PayrollEntry } from "@/lib/actions/payroll-actions";

export function exportPayrollToCSV(data: PayrollEntry[], startDate: Date, endDate: Date) {
  // 1. Define CSV Headers
  const headers = [
    "Staff Member",
    "Email",
    "Reports To",
    "Auto Seconds",
    "Manual Seconds",
    "Total Seconds",
    "Total Decimal Hours",
    "Status",
  ];

  // 2. Transform data into CSV rows
  const rows = data.map((entry) => [
    `"${entry.name}"`,
    `"${entry.email}"`,
    `"${entry.managerName || "None"}"`,
    entry.autoSeconds,
    entry.manualSeconds,
    entry.totalSeconds,
    (entry.totalSeconds / 3600).toFixed(2), // Standard Decimal Hours
    entry.status,
  ]);

  // 3. Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  // 4. Create and trigger download
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  
  const dateStr = `${format(startDate, "MMM-dd")}_to_${format(endDate, "MMM-dd")}`;
  link.setAttribute("href", url);
  link.setAttribute("download", `payroll_report_${dateStr}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
