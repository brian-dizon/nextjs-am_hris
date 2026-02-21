"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resetStaffPassword } from "@/lib/actions/staff-actions";
import { X, CheckCircle2, Copy, KeyRound, AlertCircle } from "lucide-react";

interface ResetPasswordModalProps {
  user: { id: string; name: string } | null;
  onClose: () => void;
}

export default function ResetPasswordModal({ user, onClose }: ResetPasswordModalProps) {
  const queryClient = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => resetStaffPassword(user!.id),
    onSuccess: (data) => {
      setTempPassword(data.tempPassword || "System-Reset-Triggered");
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
    },
    onError: (err: any) => {
      setError(err.message || "Failed to reset password.");
    },
  });

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {!tempPassword ? (
            <>
              <div className="mb-6">
                <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
                  <KeyRound className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Reset Password</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Are you sure you want to reset the password for <span className="font-semibold text-foreground">{user.name}</span>?
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
                >
                  {mutation.isPending ? "Resetting..." : "Confirm Reset"}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Reset Successful</h2>
              <p className="text-sm text-muted-foreground mt-2">
                A new temporary password has been generated. Provide this to the employee.
              </p>

              <div className="mt-6 rounded-xl bg-muted p-4 flex items-center justify-between border border-border">
                <code className="font-mono font-bold text-lg text-foreground tracking-wider select-all">
                  {tempPassword}
                </code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(tempPassword);
                    alert("Password copied!");
                  }}
                  className="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-primary"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted transition-all mt-8"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
