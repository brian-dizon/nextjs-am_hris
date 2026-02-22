"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { updateStaff, getManagers } from "@/lib/actions/staff-actions";
import { X, AlertCircle, ChevronDown, UserCog } from "lucide-react";
import { User as PrismaUser } from "@/lib/generated/prisma";

const updateStaffSchema = z.object({
  userId: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters."),
  role: z.enum(["ADMIN", "LEADER", "EMPLOYEE"]),
  managerId: z.string().optional().nullable(),
  position: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  dateHired: z.string().optional().nullable(),
  regularWorkHours: z.coerce.number().default(8.0),
  vacationBalance: z.coerce.number().optional(),
  sickBalance: z.coerce.number().optional(),
  earnedBalance: z.coerce.number().optional(),
});

interface EditStaffModalProps {
  user: any | null; // Use any for now to handle the joined leaveBalances
  onClose: () => void;
}

export default function EditStaffModal({ user, onClose }: EditStaffModalProps) {
  const queryClient = useQueryClient();

  const { data: managers, isLoading: isLoadingManagers } = useQuery({
    queryKey: ["managers-list"],
    queryFn: () => getManagers(),
    enabled: !!user,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(updateStaffSchema),
  });

  useEffect(() => {
    if (user) {
      const getBalance = (type: string) => 
        user.leaveBalances?.find((b: any) => b.type === type)?.balance || 0;

      reset({
        userId: user.id,
        name: user.name,
        role: user.role as any,
        managerId: user.managerId || "",
        position: user.position || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().slice(0, 10) : "",
        dateHired: user.dateHired ? new Date(user.dateHired).toISOString().slice(0, 10) : "",
        regularWorkHours: user.regularWorkHours || 8.0,
        vacationBalance: getBalance("VACATION"),
        sickBalance: getBalance("SICK"),
        earnedBalance: getBalance("EARNED"),
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: updateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-active-logs"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      onClose();
    },
  });

  const onSubmit = (data: any) => {
    const formattedData = {
      ...data,
      managerId: data.managerId === "" ? null : data.managerId
    };
    mutation.mutate(formattedData);
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <UserCog className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Edit Staff Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Complete control over identity, employment, and leave credits.
            </p>
          </div>

          {mutation.isError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              {(mutation.error as any).message || "Update failed."}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <input type="hidden" {...register("userId")} />
            
            {/* Section 1: Basic Identity */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">Basic Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Full Name</label>
                  <input
                    {...register("name")}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Position / Title</label>
                  <input
                    {...register("position")}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Employment Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">Employment & Hierarchy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Role</label>
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
                  <label className="text-sm font-medium text-foreground">Reports To</label>
                  <select
                    {...register("managerId")}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
                  >
                    <option value="">No Manager</option>
                    {managers?.filter(m => m.id !== user.id).map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Standard Day (Hrs)</label>
                  <input
                    type="number" step="0.5"
                    {...register("regularWorkHours")}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Leave Wallet */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">Leave Wallet (Days)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Vacation</label>
                  <input
                    type="number" step="0.5"
                    {...register("vacationBalance")}
                    className="block w-full bg-transparent text-lg font-bold outline-none focus:text-primary"
                  />
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Sick Leave</label>
                  <input
                    type="number" step="0.5"
                    {...register("sickBalance")}
                    className="block w-full bg-transparent text-lg font-bold outline-none focus:text-primary"
                  />
                </div>
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Earned Leave</label>
                  <input
                    type="number" step="0.5"
                    {...register("earnedBalance")}
                    className="block w-full bg-transparent text-lg font-bold outline-none focus:text-primary"
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Personal Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-1">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground">Phone Number</label>
                  <input
                    {...register("phoneNumber")}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Date of Birth</label>
                  <input
                    type="date"
                    {...register("dateOfBirth")}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-foreground">Home Address</label>
                  <textarea
                    {...register("address")}
                    rows={2}
                    className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold hover:bg-muted transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {mutation.isPending ? "Saving Changes..." : "Save Profile"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
