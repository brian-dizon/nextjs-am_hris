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
});

type EditStaffInput = z.infer<typeof updateStaffSchema>;

interface EditStaffModalProps {
  user: PrismaUser | null;
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
  } = useForm<EditStaffInput>({
    resolver: zodResolver(updateStaffSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        userId: user.id,
        name: user.name,
        role: user.role as any,
        managerId: user.managerId || "",
      });
    }
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: updateStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-active-logs"] });
      onClose();
    },
  });

  const onSubmit = (data: EditStaffInput) => {
    const formattedData = {
      ...data,
      managerId: data.managerId === "" ? null : data.managerId
    };
    mutation.mutate(formattedData);
  };

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

          <div className="mb-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <UserCog className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Edit Staff Profile</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Update details or reassign reporting manager.
            </p>
          </div>

          {mutation.isError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive border border-destructive/20">
              <AlertCircle className="h-4 w-4" />
              {(mutation.error as any).message || "Update failed."}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input type="hidden" {...register("userId")} />
            
            <div>
              <label className="text-sm font-medium">Full Name</label>
              <input
                {...register("name")}
                className="mt-1 block w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Name"
              />
              {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
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
                    {managers?.filter(m => m.id !== user.id).map((mgr) => (
                      <option key={mgr.id} value={mgr.id}>
                        {mgr.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
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
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
