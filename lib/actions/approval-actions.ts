"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function getPendingCorrections() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    return [];
  }

  const orgId = session.user.organizationId;
  const isLeader = session.user.role === "LEADER";
  const userId = session.user.id;

  // 1. Fetch Pending Corrections
  const corrections = await prisma.timeCorrection.findMany({
    where: {
      status: "PENDING",
      timeLog: {
        organizationId: orgId,
        ...(isLeader && { user: { managerId: userId } }),
      },
    },
    include: {
      timeLog: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch Pending Logs (Manual Entries)
  const pendingLogs = await prisma.timeLog.findMany({
    where: {
      status: "PENDING",
      organizationId: orgId,
      ...(isLeader && { user: { managerId: userId } }),
      // Exclude logs that already have a pending correction to avoid duplicates
      corrections: {
        none: { status: "PENDING" }
      }
    },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Unify the structure
  const unifiedCorrections = corrections.map(c => ({
    id: c.id,
    type: "CORRECTION",
    reason: c.reason,
    requestedStartTime: c.requestedStartTime,
    requestedEndTime: c.requestedEndTime,
    createdAt: c.createdAt,
    timeLog: c.timeLog,
  }));

  const unifiedLogs = pendingLogs.map(l => ({
    id: l.id, // Use Log ID as the "Request ID" for approval
    type: "MANUAL_ENTRY",
    reason: "Manual Entry Approval",
    requestedStartTime: l.startTime,
    requestedEndTime: l.endTime,
    createdAt: l.createdAt,
    timeLog: l, // Pass itself as the "timeLog" context
  }));

  return [...unifiedCorrections, ...unifiedLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function approveCorrection(requestId: string, type: string = "CORRECTION") {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    throw new Error("Unauthorized");
  }

  // Handle Manual Entry Approval (Direct Log Update)
  if (type === "MANUAL_ENTRY") {
    await prisma.timeLog.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });
    revalidatePath("/approvals");
    revalidatePath("/timesheet");
    return { success: true };
  }

  // Handle Correction Approval (Transaction)
  const correction = await prisma.timeCorrection.findUnique({
    where: { id: requestId },
    include: { timeLog: true },
  });

  if (!correction) throw new Error("Correction not found.");

  await prisma.$transaction(async (tx) => {
    // 1. Mark correction as APPROVED
    await tx.timeCorrection.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        processedAt: new Date(),
        processedById: session.user.id,
      },
    });

    // 2. Update the actual TimeLog
    let duration = correction.timeLog.duration;
    if (correction.requestedStartTime && correction.requestedEndTime) {
      duration = Math.floor(
        (new Date(correction.requestedEndTime).getTime() - 
         new Date(correction.requestedStartTime).getTime()) / 1000
      );
    }

    await tx.timeLog.update({
      where: { id: correction.timeLogId },
      data: {
        startTime: correction.requestedStartTime || correction.timeLog.startTime,
        endTime: correction.requestedEndTime || correction.timeLog.endTime,
        duration: duration,
        status: "APPROVED",
      },
    });
  });

  revalidatePath("/approvals");
  revalidatePath("/timesheet");
  return { success: true };
}

export async function rejectCorrection(requestId: string, type: string = "CORRECTION") {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    throw new Error("Unauthorized");
  }

  if (type === "MANUAL_ENTRY") {
    await prisma.timeLog.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
  } else {
    await prisma.timeCorrection.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        processedAt: new Date(),
        processedById: session.user.id,
      },
    });
  }

  revalidatePath("/approvals");
  return { success: true };
}
