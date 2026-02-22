"use server";

import prisma from "../prisma";
import { auth } from "../auth";
import { headers } from "next/headers";

export async function getUserProfile() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  return await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      manager: {
        select: {
          name: true,
          email: true,
        },
      },
      leaveBalances: true,
    },
  });
}
