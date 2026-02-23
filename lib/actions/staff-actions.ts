"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";
import { createAuditLog } from "../utils/audit-utils";

const addStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["ADMIN", "LEADER", "EMPLOYEE"]),
  managerId: z.string().optional().nullable(),
  // Extended Profile
  position: z.string().optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),
  regularWorkHours: z.coerce.number().default(8.0),
});

const updateStaffSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  role: z.enum(["ADMIN", "LEADER", "EMPLOYEE"]),
  managerId: z.string().optional().nullable(),
  // Extended Profile
  position: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),
  regularWorkHours: z.coerce.number().default(8.0),
  // Leave Credits (Mapping the simplified form structure)
  vacationBalance: z.coerce.number().optional(),
  sickBalance: z.coerce.number().optional(),
  earnedBalance: z.coerce.number().optional(),
});

export async function addStaff(data: z.infer<typeof addStaffSchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Only admins can add staff members.");
  }

  const result = addStaffSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid input data.");

  const tempPassword = `AmHRIS-${Math.random().toString(36).slice(-8)}!`;

  try {
    // 1. Create User via Admin API
    const result_auth = await (auth.api as any).admin.createUser({
      headers: await headers(),
      body: {
        email: result.data.email,
        password: tempPassword,
        name: result.data.name,
        role: result.data.role as any,
        data: {
          organizationId: session.user.organizationId,
          requirePasswordChange: true,
        },
      },
    });

    if (!result_auth?.user?.id) throw new Error("User creation failed.");

    const userId = result_auth.user.id;

    // 2. Perform Transaction for Profile Details & Initial Leave Credits
    await prisma.$transaction(async (tx) => {
      // Update the user record with extended info
      await tx.user.update({
        where: { id: userId },
        data: {
          managerId: result.data.managerId,
          position: result.data.position,
          phoneNumber: result.data.phoneNumber,
          address: result.data.address,
          dateOfBirth: result.data.dateOfBirth ? new Date(result.data.dateOfBirth) : null,
          dateHired: result.data.dateHired ? new Date(result.data.dateHired) : new Date(),
          regularWorkHours: result.data.regularWorkHours,
        },
      });

      // Initialize Leave Credits (Wallet)
      await tx.leaveBalance.createMany({
        data: [
          { userId, type: "VACATION", balance: 5.0 },
          { userId, type: "SICK", balance: 5.0 },
          { userId, type: "EARNED", balance: 0.0 },
        ],
      });
    });

    revalidatePath("/directory");
    revalidateTag(`org-staff-${session.user.organizationId}`);
    return { success: true, tempPassword };
  } catch (error: any) {
    console.error("Add staff error:", error);
    throw new Error(error?.message || "Failed to create staff member.");
  }
}

export async function updateStaff(data: z.infer<typeof updateStaffSchema>) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Only admins can update staff members.");
  }

  const result = updateStaffSchema.safeParse(data);
  if (!result.success) throw new Error("Invalid input data.");

  try {
    // Fetch old state for the audit log
    const oldUser = await prisma.user.findUnique({
      where: { id: result.data.userId },
      include: { leaveBalances: true }
    });

    // We perform the entire update via Prisma to bypass API-level role restrictions
    // while maintaining administrative authority.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: result.data.userId },
        data: {
          name: result.data.name,
          role: result.data.role,
          managerId: result.data.managerId,
          position: result.data.position,
          phoneNumber: result.data.phoneNumber,
          address: result.data.address,
          dateOfBirth: result.data.dateOfBirth ? new Date(result.data.dateOfBirth) : null,
          dateHired: result.data.dateHired ? new Date(result.data.dateHired) : null,
          regularWorkHours: result.data.regularWorkHours,
        },
      });

      // Update Leave Balances via Upsert (Update or Insert if not found)
      if (result.data.vacationBalance !== undefined) {
        await tx.leaveBalance.upsert({
          where: { userId_type: { userId: result.data.userId, type: "VACATION" } },
          update: { balance: result.data.vacationBalance },
          create: { userId: result.data.userId, type: "VACATION", balance: result.data.vacationBalance }
        });
      }
      if (result.data.sickBalance !== undefined) {
        await tx.leaveBalance.upsert({
          where: { userId_type: { userId: result.data.userId, type: "SICK" } },
          update: { balance: result.data.sickBalance },
          create: { userId: result.data.userId, type: "SICK", balance: result.data.sickBalance }
        });
      }
      if (result.data.earnedBalance !== undefined) {
        await tx.leaveBalance.upsert({
          where: { userId_type: { userId: result.data.userId, type: "EARNED" } },
          update: { balance: result.data.earnedBalance },
          create: { userId: result.data.userId, type: "EARNED", balance: result.data.earnedBalance }
        });
      }

      // Record the Audit Log
      await createAuditLog({
        userId: session.user.id,
        userName: session.user.name,
        userEmail: session.user.email,
        organizationId: session.user.organizationId,
        action: "UPDATE_STAFF",
        entityType: "User",
        entityId: result.data.userId,
        oldData: oldUser,
        newData: result.data, // This contains the new values from the form
        tx,
      });
    });

    revalidatePath("/directory");
    revalidatePath("/dashboard");
    revalidatePath("/profile");
    revalidateTag(`org-staff-${session.user.organizationId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Update staff error:", error);
    throw new Error(error.message || "Failed to update staff member.");
  }
}

export async function getStaffList() {
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
      const whereClause: any = {
        organizationId: orgId,
      };

      if (isLeader) {
        whereClause.managerId = userId;
      }

      return await prisma.user.findMany({
        where: whereClause,
        include: {
          manager: {
            select: {
              name: true,
            }
          },
          leaveBalances: true, // Now includes the wallet
        },
        orderBy: {
          joinedAt: "desc",
        },
      });
    },
    [`org-staff-list-${orgId}-${userId}`],
    {
      tags: [`org-staff-${orgId}`],
      revalidate: 3600,
    }
  )();
}

export async function getManagers() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  const orgId = session.user.organizationId;

  return await unstable_cache(
    async () => {
      return await prisma.user.findMany({
        where: {
          organizationId: orgId,
          role: {
            in: ["ADMIN", "LEADER"],
          },
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      });
    },
    [`org-managers-${orgId}`],
    {
      tags: [`org-staff-${orgId}`],
      revalidate: 3600,
    }
  )();
}

/**
 * Professional administrative password reset.
 */
export async function resetStaffPassword(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    throw new Error("Unauthorized password reset.");
  }

  const tempPassword = `AmHRIS-Reset-${Math.random().toString(36).slice(-6)}!`;

  try {
    const hashedPassword = await hashPassword(tempPassword);

    await prisma.account.updateMany({
      where: { 
        userId: userId,
        providerId: "credential"
      },
      data: {
        password: hashedPassword,
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: {
        requirePasswordChange: true,
      }
    });

    revalidatePath("/directory");
    revalidateTag(`org-staff-${session.user.organizationId}`);
    return { success: true, tempPassword };
  } catch (error: any) {
    console.error("Reset password error:", error);
    throw new Error("Failed to reset password. Please try again.");
  }
}

export async function deleteStaff(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Only admins can delete staff members.");
  }

  if (session.user.id === userId) {
    throw new Error("You cannot delete your own account.");
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath("/directory");
    revalidateTag(`org-staff-${session.user.organizationId}`);
    return { success: true };
  } catch (error) {
    console.error("Delete staff error:", error);
    throw new Error("Failed to delete staff member.");
  }
}

export async function completeOnboarding(passwordInput: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  try {
    const hashedPassword = await hashPassword(passwordInput);

    await prisma.account.updateMany({
      where: { 
        userId: session.user.id,
        providerId: "credential"
      },
      data: {
        password: hashedPassword,
      }
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        requirePasswordChange: false,
      },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Onboarding error:", error);
    throw new Error("Failed to secure account. Please try again.");
  }
}

export async function clearOnboardingFlag() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      requirePasswordChange: false,
    },
  });

  revalidatePath("/");
  return { success: true };
}
