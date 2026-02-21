"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createManualTimeLog } from "@/lib/actions/timer-actions";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, PlusCircle, CalendarClock, FileText } from "lucide-react";
import { toast } from "sonner";

const entrySchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  reason: z.string().optional(),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: "End time must be after start time",
  path: ["endTime"],
});

type EntryInput = z.infer<typeof entrySchema>;

interface AddEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddEntryModal({ isOpen, onClose }: AddEntryModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EntryInput>({
    resolver: zodResolver(entrySchema),
  });

  const mutation = useMutation({
    mutationFn: createManualTimeLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      toast.success("Entry added and submitted for approval.");
      reset();
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const onSubmit = (data: EntryInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

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
              <PlusCircle className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Manual Time Entry</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add a past work session. This will be subject to approval.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  Clock In
                </label>
                <input
                  type="datetime-local"
                  {...register("startTime")}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/50"
                />
                {errors.startTime && <p className="text-xs text-destructive font-medium">{errors.startTime.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  Clock Out
                </label>
                <input
                  type="datetime-local"
                  {...register("endTime")}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/50"
                />
                {errors.endTime && <p className="text-xs text-destructive font-medium">{errors.endTime.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Note (Optional)
              </label>
              <textarea
                {...register("reason")}
                rows={3}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all hover:bg-muted/50"
                placeholder="e.g. Forgot to clock in..."
              />
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
                {mutation.isPending ? "Adding..." : "Add Entry"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
