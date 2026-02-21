import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "./prisma";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
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
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      update: {
        after: async (user) => {
          // If the password was just changed (handled by Better Auth), 
          // we could potentially clear flags here, but for 'changePassword' 
          // we'll handle the flag flip in the UI response for now 
          // to ensure session consistency.
        }
      }
    }
  }
});
