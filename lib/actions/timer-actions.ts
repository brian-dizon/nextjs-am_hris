"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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
