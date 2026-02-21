"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "better-auth/crypto";

const addStaffSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["ADMIN", "LEADER", "EMPLOYEE"]),
  managerId: z.string().optional().nullable(),
});

const updateStaffSchema = z.object({
  userId: z.string(),
  name: z.string().min(2),
  role: z.enum(["ADMIN", "LEADER", "EMPLOYEE"]),
  managerId: z.string().optional().nullable(),
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

  // Generate a random temporary password
  const tempPassword = `AmHRIS-${Math.random().toString(36).slice(-8)}!`;

  try {
    // 1. Create the user via the admin API
    const result_auth = await auth.api.createUser({
      headers: await headers(),
      body: {
        email: result.data.email,
        password: tempPassword,
        name: result.data.name,
        role: result.data.role,
        data: {
          organizationId: session.user.organizationId,
          requirePasswordChange: true,
        },
      },
    });

    if (!result_auth?.user?.id) throw new Error("User creation failed.");

    // 2. Set the managerId directly via Prisma (since createUser data is restricted)
    if (result.data.managerId) {
      await prisma.user.update({
        where: { id: result_auth.user.id },
        data: {
          managerId: result.data.managerId,
        },
      });
    }

    revalidatePath("/directory");
    return { success: true, tempPassword };
  } catch (error: any) {
    console.error("Add staff error:", error);
    const message = error?.message || "Failed to create staff member.";
    throw new Error(message);
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
    // Keep updates in Prisma to support app-specific enum roles safely.
    await prisma.user.update({
      where: { id: result.data.userId },
      data: {
        name: result.data.name,
        role: result.data.role,
        managerId: result.data.managerId,
      },
    });

    revalidatePath("/directory");
    revalidatePath("/dashboard");
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

  // Hierarchical Filter: Leaders only see their direct reports
  const whereClause: any = {
    organizationId: session.user.organizationId,
  };

  if (session.user.role === "LEADER") {
    whereClause.managerId = session.user.id;
  }

  return await prisma.user.findMany({
    where: whereClause,
    include: {
      manager: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      joinedAt: "desc",
    },
  });
}

export async function getManagers() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  return await prisma.user.findMany({
    where: {
      organizationId: session.user.organizationId,
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
}

/**
 * Professional administrative password reset.
 * Uses Better Auth's official crypto utility to guarantee compatibility.
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
    // 1. Generate a valid hash using Better Auth's official crypto utility
    const hashedPassword = await hashPassword(tempPassword);

    // 2. Update the account table directly via Prisma
    await prisma.account.updateMany({
      where: { 
        userId: userId,
        providerId: "credential"
      },
      data: {
        password: hashedPassword,
      }
    });

    // 3. Set the forced reset flag
    await prisma.user.update({
      where: { id: userId },
      data: {
        requirePasswordChange: true,
      }
    });

    revalidatePath("/directory");
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
    return { success: true };
  } catch (error) {
    console.error("Delete staff error:", error);
    throw new Error("Failed to delete staff member.");
  }
}

/**
 * Finalizes onboarding by setting a permanent password.
 * Bypasses currentPassword requirement for a better UX during forced resets.
 */
export async function completeOnboarding(passwordInput: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  try {
    // 1. Generate a valid hash using Better Auth's official crypto utility
    const hashedPassword = await hashPassword(passwordInput);

    // 2. Update the account table directly via Prisma
    await prisma.account.updateMany({
      where: { 
        userId: session.user.id,
        providerId: "credential"
      },
      data: {
        password: hashedPassword,
      }
    });

    // 3. Clear the requirement flag
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
