import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

interface AuditLogParams {
  userId: string | null;
  userName: string;
  userEmail: string;
  organizationId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldData?: any;
  newData?: any;
  tx?: any; // For prisma transactions
}

/**
 * Creates an audit log entry.
 * @param params - The audit log details.
 * @returns The created AuditLog record.
 */
export async function createAuditLog(params: AuditLogParams) {
  const {
    userId,
    userName,
    userEmail,
    organizationId,
    action,
    entityType,
    entityId,
    oldData,
    newData,
    tx,
  } = params;

  const headerList = await headers();
  const userAgent = headerList.get("user-agent") || "unknown";
  
  // Get IP address, handling potential proxies
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor ? forwardedFor.split(",")[0] : "unknown";

  const db = tx || prisma;

  try {
    return await db.auditLog.create({
      data: {
        userId,
        userName,
        userEmail,
        organizationId,
        action,
        entityType,
        entityId,
        oldData: oldData ? JSON.parse(JSON.stringify(oldData)) : null,
        newData: newData ? JSON.parse(JSON.stringify(newData)) : null,
        userAgent,
        ipAddress,
      },
    });
  } catch (error) {
    // We log the error but don't want to crash the main operation if audit fails
    console.error("Failed to create audit log:", error);
    return null;
  }
}
