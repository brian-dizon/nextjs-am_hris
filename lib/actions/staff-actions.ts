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
    await auth.api.signUpEmail({
      body: {
        email: result.data.email,
        password: tempPassword,
        name: result.data.name,
        organizationId: session.user.organizationId,
        role: result.data.role,
        requirePasswordChange: true,
      },
    });

    revalidatePath("/directory");
    return { success: true, tempPassword };
  } catch (error) {
    console.error("Add staff error:", error);
    throw new Error("Failed to create staff member. Email might already be in use.");
  }
}

export async function getStaffList() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return [];

  return await prisma.user.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    orderBy: {
      joinedAt: "desc",
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
