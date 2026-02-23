"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { LeaveStatus } from "@/lib/generated/prisma";
import { createAuditLog } from "../utils/audit-utils";
import { addDays, isWeekend, startOfDay, addHours, differenceInCalendarDays } from "date-fns";

export async function getPendingApprovals() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    return [];
  }

  const orgId = session.user.organizationId;
  const isLeader = session.user.role === "LEADER";
  const userId = session.user.id;

  return await unstable_cache(
    async () => {
      // Define common WHERE clause for filtering by organization and manager
      const commonWhere = isLeader ? { user: { managerId: userId } } : {};

      // 1. Fetch Pending Time Corrections
      const corrections = await prisma.timeCorrection.findMany({
        where: {
          status: "PENDING",
          timeLog: {
            organizationId: orgId,
            ...commonWhere,
          },
        },
        include: {
          timeLog: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // 2. Fetch Pending TimeLogs (Manual Entries)
      const pendingLogs = await prisma.timeLog.findMany({
        where: {
          status: "PENDING",
          organizationId: orgId,
          ...commonWhere,
          // Exclude logs that already have a pending correction to avoid duplicates
          corrections: {
            none: { status: "PENDING" }
          }
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      // 3. Fetch Pending Leave Requests
      const leaveRequests = await prisma.leaveRequest.findMany({
        where: {
          status: LeaveStatus.PENDING,
          organizationId: orgId,
          ...commonWhere,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });


      // 4. Unify the structure
      const unifiedCorrections = corrections.map(c => ({
        id: c.id,
        type: "CORRECTION",
        reason: c.reason || "", // Provide default if null
        requestedStartTime: c.requestedStartTime,
        requestedEndTime: c.requestedEndTime,
        createdAt: c.createdAt,
        timeLog: c.timeLog,
        userId: c.timeLog.user.id,
        userName: c.timeLog.user.name,
        userEmail: c.timeLog.user.email,
      }));

      const unifiedLogs = pendingLogs.map(l => ({
        id: l.id, // Use Log ID as the "Request ID" for approval
        type: "MANUAL_ENTRY",
        reason: "Manual Entry Approval",
        requestedStartTime: l.startTime,
        requestedEndTime: l.endTime,
        createdAt: l.createdAt,
        timeLog: l, // Pass itself as the "timeLog" context
        userId: l.user.id,
        userName: l.user.name,
        userEmail: l.user.email,
      }));

      const unifiedLeaveRequests = leaveRequests.map(lr => ({
        id: lr.id,
        type: "LEAVE_REQUEST",
        reason: lr.reason || "",
        startDate: lr.startDate,
        endDate: lr.endDate,
        leaveType: lr.type,
        netDays: lr.netDays,
        createdAt: lr.createdAt,
        userId: lr.user.id,
        userName: lr.user.name,
        userEmail: lr.user.email,
      }));


      return [...unifiedCorrections, ...unifiedLogs, ...unifiedLeaveRequests].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    [`pending-approvals-${orgId}-${userId}`],
    {
      tags: [`pending-approvals-${orgId}`],
      revalidate: 3600,
    }
  )();
}

export async function approveRequest(requestId: string, type: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    throw new Error("Unauthorized");
  }

  // Handle Leave Request Approval
  if (type === "LEAVE_REQUEST") {
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { user: { include: { leaveBalances: true } } },
    });

    if (!leaveRequest) throw new Error("Leave request not found.");

    await prisma.$transaction(async (tx) => {
      // 1. Mark leave request as APPROVED
      await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: LeaveStatus.APPROVED,
          processedAt: new Date(),
          processedById: session.user.id,
        },
      });

      // 2. Deduct from LeaveBalance
      const leaveBalance = leaveRequest.user.leaveBalances.find(b => b.type === leaveRequest.type);
      if (!leaveBalance || leaveBalance.balance < leaveRequest.netDays) {
        throw new Error(`Insufficient ${leaveRequest.type.toLowerCase()} leave balance for deduction.`);
      }

      await tx.leaveBalance.update({
        where: { id: leaveBalance.id },
        data: {
          balance: {
            decrement: leaveRequest.netDays,
          },
        },
      });

      // 3. Automatically create TimeLogs for the leave duration
      const logsToCreate = [];
      let currentDay = startOfDay(new Date(leaveRequest.startDate));
      const endDay = startOfDay(new Date(leaveRequest.endDate));

      while (currentDay <= endDay) {
        if (!isWeekend(currentDay)) {
          logsToCreate.push({
            userId: leaveRequest.userId,
            organizationId: leaveRequest.organizationId,
            startTime: currentDay,
            endTime: addHours(currentDay, 8), // Standard 8-hour day
            duration: 28800, // 8 hours in seconds
            type: "LEAVE" as any, // Using the new LEAVE type
            status: "APPROVED" as any,
            isManual: true, // Manual entries for easier tracking
            processedById: session.user.id,
            processedAt: new Date(),
          });
        }
        currentDay = addDays(currentDay, 1);
      }

      if (logsToCreate.length > 0) {
        await tx.timeLog.createMany({
          data: logsToCreate,
        });
      }

      // 4. Record the Audit Log within the transaction
      await createAuditLog({
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        organizationId: session.user.organizationId,
        action: "APPROVE_LEAVE_REQUEST",
        entityType: "LeaveRequest",
        entityId: requestId,
        oldData: { balanceBefore: leaveBalance.balance },
        newData: { 
          status: LeaveStatus.APPROVED, 
          balanceAfter: leaveBalance.balance - leaveRequest.netDays,
          logsCreated: logsToCreate.length
        },
        tx,
      });
    });

    revalidatePath("/approvals");
    revalidatePath("/profile"); // To update user's leave balance display
    revalidatePath("/dashboard"); // For leave quick actions
    revalidateTag(`pending-approvals-${session.user.organizationId}`);
    return { success: true };
  }


  // Handle Manual Entry Approval (Direct Log Update)
  if (type === "MANUAL_ENTRY") {
    await prisma.timeLog.update({
      where: { id: requestId },
      data: { status: "APPROVED" },
    });

    await createAuditLog({
      userId: session.user.id,
      userName: session.user.name,
      userEmail: session.user.email,
      organizationId: session.user.organizationId,
      action: "APPROVE_MANUAL_ENTRY",
      entityType: "TimeLog",
      entityId: requestId,
    });

    revalidatePath("/approvals");
    revalidatePath("/timesheet");
    revalidateTag(`pending-approvals-${session.user.organizationId}`);
    return { success: true };
  }

  // Handle Correction Approval (Transaction)
  if (type === "CORRECTION") {
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

      const updatedLog = await tx.timeLog.update({
        where: { id: correction.timeLogId },
        data: {
          startTime: correction.requestedStartTime || correction.timeLog.startTime,
          endTime: correction.requestedEndTime || correction.timeLog.endTime,
          duration: duration,
          status: "APPROVED",
        },
      });

      // 3. Audit Log
      await createAuditLog({
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        organizationId: session.user.organizationId,
        action: "APPROVE_TIME_CORRECTION",
        entityType: "TimeLog",
        entityId: correction.timeLogId,
        oldData: correction.timeLog,
        newData: updatedLog,
        tx,
      });
    });

    revalidatePath("/approvals");
    revalidatePath("/timesheet");
    revalidateTag(`pending-approvals-${session.user.organizationId}`);
    return { success: true };
  }

  throw new Error("Unknown request type.");
}

export async function rejectRequest(requestId: string, type: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    throw new Error("Unauthorized");
  }

  if (type === "LEAVE_REQUEST") {
    await prisma.leaveRequest.update({
      where: { id: requestId },
      data: {
        status: LeaveStatus.REJECTED,
        processedAt: new Date(),
        processedById: session.user.id,
      },
    });
  } else if (type === "MANUAL_ENTRY") {
    await prisma.timeLog.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
  } else if (type === "CORRECTION") {
    await prisma.timeCorrection.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        processedAt: new Date(),
        processedById: session.user.id,
      },
    });
  } else {
    throw new Error("Unknown request type.");
  }

  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    organizationId: session.user.organizationId,
    action: `REJECT_${type}`,
    entityType: type === "LEAVE_REQUEST" ? "LeaveRequest" : "TimeLog",
        entityId: requestId,
      });
    
      revalidatePath("/approvals");
      revalidateTag(`pending-approvals-${session.user.organizationId}`);
      return { success: true };
    }
    