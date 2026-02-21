"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
    const user = await auth.api.signUpEmail({
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

export async function resetStaffPassword(userId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LEADER")) {
    throw new Error("Unauthorized password reset.");
  }

  // Set the flag back to true
  await prisma.user.update({
    where: { id: userId },
    data: {
      requirePasswordChange: true,
    }
  });

  // Note: Better Auth handles the actual password reset via its internal API or email flow.
  // For this direct reset, we are flagging the user to update it themselves.
  
  return { success: true };
}

export async function completeOnboarding(password: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) throw new Error("Unauthorized");

  // Since direct hashing is complex outside the Better Auth internal flow,
  // we will use the most robust way: The Better Auth Server API.
  // The 'resetPassword' API actually works on the server without a token 
  // if you provide the userId in certain Better Auth versions, but 
  // let's use the most compatible method for v1.
  
  try {
    // We update the user's password using the Better Auth internal update method
    // which handles the hashing automatically.
    await auth.api.updateUser({
      headers: await headers(),
      body: {
        password: password,
      }
    });

    // Clear the requirement flag
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
    const message = error?.message || "Failed to update password. Ensure it's at least 8 characters.";
    throw new Error(message);
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
