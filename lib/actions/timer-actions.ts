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

  // Admin/Leader check: Ensure only authorized users can see all logs
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    return [];
  }

  return await prisma.timeLog.findMany({
    where: {
      organizationId: session.user.organizationId,
      endTime: null,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
          email: true,
        },
      },
    },
    orderBy: {
      startTime: "asc",
    },
  });
}
