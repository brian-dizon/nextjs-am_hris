"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";

/**
 * Fetches the audit logs for the current organization.
 * Strictly restricted to ADMIN role.
 */
export async function getAuditLogs() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Only admins can view activity logs.");
  }

  return await prisma.auditLog.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    include: {
      user: {
        select: {
          image: true,
        }
      }
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 100, // Limit to recent 100 for the "Live Feed"
  });
}
