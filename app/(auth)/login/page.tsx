"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginInput = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsPending(true);
    setError(null);

    const { error } = await signIn.email({
      email: data.email,
      password: data.password,
      callbackURL: "/dashboard",
    });

    if (error) {
      setError(error.message || "Invalid email or password.");
      setIsPending(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Am.HRIS</h1>
          <p className="mt-2 text-muted-foreground">Sign in to your account</p>
        </div>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Email Address</label>
              <input
                {...register("email")}
                type="email"
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="name@company.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Password</label>
              </div>
              <input
                {...register("password")}
                type="password"
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
