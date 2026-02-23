"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { initializeSystemSchema, type InitializeSystemInput } from "../validations/auth";
import { redirect } from "next/navigation";

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

export async function initializeSystem(data: InitializeSystemInput) {
  // 1. Validate inputs
  const result = initializeSystemSchema.safeParse(data);
  if (!result.success) {
    return { error: "Invalid input data." };
  }

  const { companyName, adminName, adminEmail, password } = result.data;

  // 2. Genesis Guard: Check if ANY organization already exists
  const existingOrgCount = await prisma.organization.count();
  if (existingOrgCount > 0) {
    return { error: "The system is already initialized. Please use an invitation to join." };
  }

  let orgId: string | null = null;

  try {
    // 3. Execution Flow: Create the Organization FIRST
    // We do this outside a Prisma transaction so it's committed and visible 
    // to Better Auth's internal database connection.
    const org = await prisma.organization.create({
      data: {
        name: companyName,
        slug: slugify(companyName),
      },
    });
    orgId = org.id;

    // 4. Execution Flow: Create the First User (ADMIN) via Better Auth
    await (auth.api as any).signUpEmail({
      body: {
        email: adminEmail,
        password: password,
        name: adminName,
        data: {
          organizationId: orgId,
          role: "ADMIN",
        },
      },
    });

  } catch (error) {
    console.error("Initialization error:", error);
    
    // Manual Rollback: If user creation fails, delete the "orphan" organization
    if (orgId) {
      await prisma.organization.delete({ where: { id: orgId } }).catch(console.error);
    }

    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Initialization error: ${errorMessage}` };
  }

  redirect("/login");
}
