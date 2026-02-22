"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { calculateNetWorkDays } from "../utils/date-utils";
import { LeaveType, LeaveStatus } from "@/lib/generated/prisma";
import { isAfter } from "date-fns";
import { createAuditLog } from "../utils/audit-utils";

const leaveRequestSchema = z.object({
  type: z.nativeEnum(LeaveType),
  startDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(new Date(date).getTime()), "Invalid end date"),
  reason: z.string().min(10, "Reason must be at least 10 characters.").optional(),
});

export async function requestLeave(data: z.infer<typeof leaveRequestSchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  const result = leaveRequestSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid leave request data.");

  const { type, startDate, endDate, reason } = result.data;
  const parsedStartDate = new Date(startDate);
  const parsedEndDate = new Date(endDate);

  if (isAfter(parsedStartDate, parsedEndDate)) {
    throw new Error("Start date cannot be after end date.");
  }

  const netDays = calculateNetWorkDays(parsedStartDate, parsedEndDate);

  if (netDays <= 0) {
    throw new Error("Leave request must cover at least one working day.");
  }

  // 1. Check available balance
  const leaveBalance = await prisma.leaveBalance.findUnique({
    where: {
      userId_type: {
        userId: session.user.id,
        type: type,
      },
    },
  });

  if (!leaveBalance || leaveBalance.balance < netDays) {
    throw new Error(`Insufficient ${type.toLowerCase()} leave balance.`);
  }

  // 2. Check for overlapping requests (PENDING or APPROVED)
  const overlappingRequest = await prisma.leaveRequest.findFirst({
    where: {
      userId: session.user.id,
      status: {
        in: ["PENDING", "APPROVED"],
      },
      OR: [
        {
          startDate: { lte: parsedEndDate },
          endDate: { gte: parsedStartDate },
        },
      ],
    },
  });

  if (overlappingRequest) {
    throw new Error("You already have an overlapping leave request.");
  }

  // 3. Create the leave request
  const leaveRequest = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      type: type,
      startDate: parsedStartDate,
      endDate: parsedEndDate,
      netDays: netDays,
      reason: reason,
      status: "PENDING", // Always pending for manager approval
    },
  });

  // 4. Record the Audit Log
  await createAuditLog({
    userId: session.user.id,
    userName: session.user.name,
    userEmail: session.user.email,
    organizationId: session.user.organizationId,
    action: "CREATE_LEAVE_REQUEST",
    entityType: "LeaveRequest",
    entityId: leaveRequest.id,
    newData: leaveRequest,
  });

  revalidatePath("/profile"); // To update leave application button visibility or history
  revalidatePath("/approvals"); // To notify manager
  return { success: true };
}

export async function getLeaveRequests() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  return await prisma.leaveRequest.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

