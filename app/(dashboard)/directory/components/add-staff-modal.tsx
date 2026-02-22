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
  position: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),
  regularWorkHours: z.number(),
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
  } = useForm({
    resolver: zodResolver(addStaffSchema),
    defaultValues: { role: "EMPLOYEE" as const, managerId: "", regularWorkHours: 8.0 },
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

  const onSubmit = (data: any) => {
    setError(null);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl max-h-[90vh] overflow-y-auto">
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
                  Provision a new account and profile for your organization.
                </p>
              </div>

              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">Basic Identity</h3>
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <input
                        {...register("name")}
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="John Doe"
                      />
                      {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium">Email Address</label>
                      <input
                        {...register("email")}
                        type="email"
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="john@company.com"
                      />
                      {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Phone Number</label>
                      <input
                        {...register("phoneNumber")}
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                  </div>

                  {/* Work Details */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">Employment Details</h3>
                    <div>
                      <label className="text-sm font-medium text-foreground">Position / Title</label>
                      <input
                        {...register("position")}
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        placeholder="Senior Developer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Role</label>
                        <select
                          {...register("role")}
                          className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="LEADER">Team Leader</option>
                          <option value="ADMIN">Administrator</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">Reports To</label>
                        <select
                          {...register("managerId")}
                          disabled={isLoadingManagers}
                          className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none disabled:opacity-50"
                        >
                          <option value="">No Manager</option>
                          {managers?.map((mgr) => (
                            <option key={mgr.id} value={mgr.id}>
                              {mgr.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground">Regular Work Hours (Day)</label>
                      <input
                        {...register("regularWorkHours")}
                        type="number"
                        step="0.5"
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">Personal & Contract</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-foreground">Date of Birth</label>
                      <input
                        type="date"
                        {...register("dateOfBirth")}
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Date Hired</label>
                      <input
                        type="date"
                        {...register("dateHired")}
                        className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Home Address</label>
                    <textarea
                      {...register("address")}
                      rows={2}
                      className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                      placeholder="123 Main St, City, Country"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 rounded-xl bg-blue-50 p-4 border border-blue-100">
                  <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                  <p className="text-xs text-blue-700 font-medium">
                    New staff will automatically be granted 5 Vacation and 5 Sick days.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full rounded-xl bg-primary px-4 py-4 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50 mt-2"
                >
                  {mutation.isPending ? "Initializing Records..." : "Provision Staff Account"}
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
