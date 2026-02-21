import { z } from "zod";

export const initializeSystemSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters."),
  adminName: z.string().min(2, "Admin name must be at least 2 characters."),
  adminEmail: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type InitializeSystemInput = z.infer<typeof initializeSystemSchema>;
