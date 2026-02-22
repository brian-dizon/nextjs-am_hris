import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import prisma from "./prisma";

const getBaseUrl = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  baseURL: getBaseUrl(),
  plugins: [
    nextCookies(), 
    admin({
      defaultRole: "EMPLOYEE",
      adminRoles: ["ADMIN"],
      roles: {
        ADMIN: adminAc,
        LEADER: userAc,
        EMPLOYEE: userAc,
      },
    })
  ],
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "EMPLOYEE",
      },
      organizationId: {
        type: "string",
        required: true,
      },
      requirePasswordChange: {
        type: "boolean",
        defaultValue: false,
      },
      managerId: {
        type: "string",
        required: false,
      },
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  /*
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  */
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          // Hooks can be used here for future automated audit trails
        }
      }
    }
  }
});
