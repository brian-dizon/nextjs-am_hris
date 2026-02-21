"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { clearOnboardingFlag } from "@/lib/actions/staff-actions";
import { useRouter } from "next/navigation";
import { Lock, CheckCircle2, AlertCircle } from "lucide-react";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Temporary password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = async (data: ChangePasswordInput) => {
    setIsPending(true);
    setError(null);

    try {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        setError(error.message || "Failed to update password.");
        setIsPending(false);
      } else {
        // Explicitly clear the flag in the database
        await clearOnboardingFlag();
        
        setIsSuccess(true);
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      }
    } catch (err: any) {
      setError("An unexpected error occurred.");
      setIsPending(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set Permanent Password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSuccess 
              ? "Password updated successfully! Redirecting..." 
              : "Please use the temporary password provided by your Admin to secure your account."}
          </p>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500 mb-4" />
            <p className="text-sm font-medium text-emerald-600">Your account is now secure.</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Temporary Password</label>
                  <input
                    {...register("currentPassword")}
                    type="password"
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Enter temporary password"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-xs text-destructive">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <div className="h-px bg-border w-full mb-6" />
                  <label className="text-sm font-medium text-foreground">New Permanent Password</label>
                  <input
                    {...register("newPassword")}
                    type="password"
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Minimum 8 characters"
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-xs text-destructive">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground">Confirm New Password</label>
                  <input
                    {...register("confirmPassword")}
                    type="password"
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    placeholder="Repeat new password"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending ? "Updating Security..." : "Complete Onboarding"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
