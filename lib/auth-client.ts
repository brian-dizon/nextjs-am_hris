import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

const getBaseUrl = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  // In the browser, we can just use the current origin
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
        },
        organizationId: {
          type: "string",
        },
        requirePasswordChange: {
          type: "boolean",
        },
        managerId: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
