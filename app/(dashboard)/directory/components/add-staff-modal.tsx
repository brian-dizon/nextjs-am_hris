"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addStaff, getManagers } from "@/lib/actions/staff-actions";
import { X, CheckCircle2, Copy, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const addStaffSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  role: z.enum(["ADMIN", "LEADER", "EMPLOYEE"]),
  managerId: z.string().optional().nullable(),
});

type AddStaffInput = z.infer<typeof addStaffSchema>;

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStaffModal({ isOpen, onClose }: AddStaffModalProps) {
  const queryClient = useQueryClient();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: managers, isLoading: isLoadingManagers } = useQuery({
    queryKey: ["managers-list"],
    queryFn: () => getManagers(),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddStaffInput>({
    resolver: zodResolver(addStaffSchema),
    defaultValues: { role: "EMPLOYEE", managerId: "" },
  });

  const mutation = useMutation({
    mutationFn: addStaff,
    onSuccess: (data) => {
      setTempPassword(data.tempPassword);
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      queryClient.invalidateQueries({ queryKey: ["managers-list"] });
      reset();
    },
    onError: (err: any) => {
      setError(err.message || "Something went wrong.");
    },
  });

  const onSubmit = (data: AddStaffInput) => {
    setError(null);
    // Convert empty string to null for optional managerId
    const formattedData = {
      ...data,
      managerId: data.managerId === "" ? null : data.managerId
    };
    mutation.mutate(formattedData);
  };

  const handleClose = () => {
    setTempPassword(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          {!tempPassword ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Add Staff</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Provision a new account for your organization.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Full Name</label>
                  <input
                    {...register("name")}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="John Doe"
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    {...register("email")}
                    type="email"
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="john@company.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <div className="relative mt-1">
                      <select
                        {...register("role")}
                        className="block w-full rounded-lg border border-border bg-background py-2 pl-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="LEADER">Team Leader</option>
                        <option value="ADMIN">Administrator</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Reports To</label>
                    <div className="relative mt-1">
                      <select
                        {...register("managerId")}
                        disabled={isLoadingManagers}
                        className="block w-full rounded-lg border border-border bg-background py-2 pl-3 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none disabled:opacity-50"
                      >
                        <option value="">No Manager</option>
                        {managers?.map((mgr) => (
                          <option key={mgr.id} value={mgr.id}>
                            {mgr.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 mt-2"
                >
                  {mutation.isPending ? "Creating account..." : "Create Staff Member"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Staff Created!</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Provide this temporary password to the employee. They will be forced to change it on their first login.
              </p>

              <div className="mt-6 rounded-xl bg-muted p-4 flex items-center justify-between border border-border group">
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
                onClick={handleClose}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted transition-all mt-8"
              >
                Close and Finish
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
