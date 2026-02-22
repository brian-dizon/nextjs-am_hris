"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { startOfWeek, endOfWeek, startOfDay, endOfDay } from "date-fns";

export async function getActiveTimeLog() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return await prisma.timeLog.findFirst({
    where: {
      userId: session.user.id,
      endTime: null,
    },
  });
}

export async function clockIn() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  // Check for existing active log
  const existingActive = await getActiveTimeLog();
  if (existingActive) throw new Error("Already clocked in");

  const log = await prisma.timeLog.create({
    data: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      type: "WORK",
    },
  });

  revalidatePath("/dashboard");
  return log;
}

export async function clockOut() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const activeLog = await getActiveTimeLog();
  if (!activeLog) throw new Error("No active timer found");

  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - activeLog.startTime.getTime()) / 1000);

  const updatedLog = await prisma.timeLog.update({
    where: { id: activeLog.id },
    data: {
      endTime,
      duration,
    },
  });

  revalidatePath("/dashboard");
  return updatedLog;
}

import { z } from "zod";

const correctionSchema = z.object({
  timeLogId: z.string(),
  requestedStartTime: z.string().optional(), // ISO string
  requestedEndTime: z.string().optional(),   // ISO string
  reason: z.string().min(5),
});

export async function adminClockOut(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Only admins can force clock out staff.");
  }

  // Find the active log for the target user in the same organization
  const activeLog = await prisma.timeLog.findFirst({
    where: {
      userId: userId,
      organizationId: session.user.organizationId,
      endTime: null,
    },
  });

  if (!activeLog) throw new Error("No active timer found for this user.");

  const endTime = new Date();
  const duration = Math.floor((endTime.getTime() - activeLog.startTime.getTime()) / 1000);

  const updatedLog = await prisma.timeLog.update({
    where: { id: activeLog.id },
    data: {
      endTime,
      duration,
    },
  });

  revalidatePath("/dashboard");
  return updatedLog;
}

export async function requestTimeCorrection(data: z.infer<typeof correctionSchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const result = correctionSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid correction data.");

  // Verify the log belongs to the user
  const log = await prisma.timeLog.findUnique({
    where: { id: result.data.timeLogId },
  });

  if (!log || log.userId !== session.user.id) {
    throw new Error("Log not found or access denied.");
  }

  // Create correction request
  await prisma.timeCorrection.create({
    data: {
      timeLogId: log.id,
      requestedStartTime: result.data.requestedStartTime ? new Date(result.data.requestedStartTime) : null,
      requestedEndTime: result.data.requestedEndTime ? new Date(result.data.requestedEndTime) : null,
      reason: result.data.reason,
      status: "PENDING",
    },
  });

  // Flag the log as pending review (optional workflow step)
  // await prisma.timeLog.update({
  //   where: { id: log.id },
  //   data: { status: "PENDING" }
  // });

  revalidatePath("/timesheet");
  return { success: true };
}

const manualEntrySchema = z.object({
  startTime: z.string(), // ISO datetime
  endTime: z.string(),   // ISO datetime
  reason: z.string().optional(),
});

export async function createManualTimeLog(data: z.infer<typeof manualEntrySchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const result = manualEntrySchema.safeParse(data);
  if (!result.success) throw new Error("Invalid entry data.");

  const start = new Date(result.data.startTime);
  const end = new Date(result.data.endTime);

  if (end <= start) {
    throw new Error("End time must be after start time.");
  }

  const duration = Math.floor((end.getTime() - start.getTime()) / 1000);

  // Create the log directly. 
  // Note: Since default status is PENDING, this will automatically appear in the manager's approval queue
  // if we update the 'getPendingCorrections' logic to also include PENDING logs, 
  // OR we rely on the fact that PENDING logs act as requests themselves.
  
  // Strategy: We treat a PENDING log effectively as a "Request".
  await prisma.timeLog.create({
    data: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      startTime: start,
      endTime: end,
      duration: duration,
      status: "PENDING",
      type: "WORK",
      isManual: true,
    },
  });

  revalidatePath("/timesheet");
  return { success: true };
}

export async function getTimeStats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // 1. Aggregate Total Duration for Current Month
  const aggregations = await prisma.timeLog.aggregate({
    _sum: {
      duration: true,
    },
    where: {
      userId: session.user.id,
      startTime: {
        gte: startOfMonth,
        lte: endOfMonth,
      },
      type: "WORK",
      // We might filter by status: "APPROVED" in strict systems
    },
  });

  // 2. Count Pending Corrections
  // We need to join the TimeLog to ensure we only count the user's corrections
  const pendingCorrections = await prisma.timeCorrection.count({
    where: {
      status: "PENDING",
      timeLog: {
        userId: session.user.id,
      },
    },
  });

  return {
    totalSeconds: aggregations._sum.duration || 0,
    pendingCorrections,
  };
}

export async function getTimeLogs() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  return await prisma.timeLog.findMany({
    where: {
      userId: session.user.id,
      endTime: { not: null }, // Only show completed logs in history
    },
    orderBy: {
      startTime: "desc",
    },
    take: 50, // Limit to 50 for now
  });
}

export async function getOrganizationActiveLogs() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    return [];
  }

  // Hierarchical Filter: Leaders only see their subordinates
  const whereClause: any = {
    organizationId: session.user.organizationId,
    endTime: null,
  };

  if (session.user.role === "LEADER") {
    whereClause.user = {
      managerId: session.user.id,
    };
  }

  return await prisma.timeLog.findMany({
    where: whereClause,
    include: {
      user: {
        select: {
          name: true,
          image: true,
          email: true,
          manager: {
            select: {
              name: true,
            }
          }
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });
}

/**
 * Fetches the current week's time logs for the user.
 * Week starts on Monday.
 */
export async function getWeeklyTimeLogs() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  return await prisma.timeLog.findMany({
    where: {
      userId: session.user.id,
      startTime: {
        gte: weekStart,
        lte: weekEnd,
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });
}
