"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";

export type PayrollEntry = {
  userId: string;
  name: string;
  email: string;
  managerName: string | null;
  totalSeconds: number;
  autoSeconds: number;   // From standard timer
  manualSeconds: number; // From manual entries
  pendingCount: number;
  status: "READY" | "INCOMPLETE";
};

export async function getPayrollReport(startDate: Date, endDate: Date) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized access to payroll data.");
  }

  const adjustedEndDate = new Date(endDate);
  adjustedEndDate.setHours(23, 59, 59, 999);

  console.log("Fetching payroll from:", startDate, "to:", adjustedEndDate);

  const users = await prisma.user.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    include: {
      manager: {
        select: { name: true },
      },
      timeLogs: {
        where: {
          startTime: {
            gte: startDate,
            lte: adjustedEndDate,
          },
        },
        select: {
          duration: true,
          status: true,
          isManual: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  console.log("Users found for payroll:", users.length);

  const report: PayrollEntry[] = users.map((user) => {
    let totalSeconds = 0;
    let autoSeconds = 0;
    let manualSeconds = 0;
    let pendingCount = 0;

    user.timeLogs.forEach((log) => {
      if (log.status === "APPROVED" && log.duration) {
        totalSeconds += log.duration;
        
        if (log.isManual) {
          manualSeconds += log.duration;
        } else {
          autoSeconds += log.duration;
        }
      } else if (log.status === "PENDING") {
        pendingCount++;
      }
    });

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      managerName: user.manager?.name || null,
      totalSeconds,
      autoSeconds,
      manualSeconds,
      pendingCount,
      status: pendingCount > 0 ? "INCOMPLETE" : "READY",
    };
  });

  return report;
}
