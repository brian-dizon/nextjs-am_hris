import "better-auth";

declare module "better-auth" {
  interface User {
    role: "ADMIN" | "LEADER" | "EMPLOYEE";
    organizationId: string;
    requirePasswordChange: boolean;
    managerId?: string | null;
  }
  interface Session {
    user: User;
  }
}
