"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { initializeSystemSchema, type InitializeSystemInput } from "@/lib/validations/auth";
import { initializeSystem } from "@/lib/actions/auth-actions";

export default function SetupPage() {
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InitializeSystemInput>({
    resolver: zodResolver(initializeSystemSchema),
  });

  const onSubmit = (data: InitializeSystemInput) => {
    startTransition(async () => {
      const result = await initializeSystem(data);
      if (result?.error) {
        alert(result.error);
      }
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Am.HRIS</h1>
          <p className="mt-2 text-muted-foreground">System Initialization</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Company Info
            </h2>
            <div>
              <label className="text-sm font-medium">Company Name</label>
              <input
                {...register("companyName")}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder="e.g. Acme Inc."
              />
              {errors.companyName && (
                <p className="mt-1 text-xs text-destructive">{errors.companyName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 rounded-xl border border-border p-4 bg-muted/10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Primary Admin
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Admin Name</label>
                <input
                  {...register("adminName")}
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="Your Name"
                />
                {errors.adminName && (
                  <p className="mt-1 text-xs text-destructive">{errors.adminName.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Email Address</label>
                <input
                  {...register("adminEmail")}
                  type="email"
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="admin@acme.com"
                />
                {errors.adminEmail && (
                  <p className="mt-1 text-xs text-destructive">{errors.adminEmail.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Password</label>
                <input
                  {...register("password")}
                  type="password"
                  className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Initialising System..." : "Complete Setup"}
          </button>
        </form>
      </div>
    </div>
  );
}
