"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { requestTimeCorrection } from "@/lib/actions/timer-actions";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, AlertCircle, CalendarClock, FileText, FileEdit } from "lucide-react";
import { TimeLog } from "@/lib/generated/prisma";
import { useEffect } from "react";
import { toast } from "sonner";

const correctionSchema = z.object({
  timeLogId: z.string(),
  requestedStartTime: z.string().optional(),
  requestedEndTime: z.string().optional(),
  reason: z.string().min(5, "Reason must be at least 5 characters."),
});

type CorrectionInput = z.infer<typeof correctionSchema>;

interface CorrectionModalProps {
  log: TimeLog | null;
  onClose: () => void;
}

export default function CorrectionModal({ log, onClose }: CorrectionModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CorrectionInput>({
    resolver: zodResolver(correctionSchema),
  });

  useEffect(() => {
    if (log) {
      const formatForInput = (date: Date) => {
        return new Date(date).toISOString().slice(0, 16);
      };

      reset({
        timeLogId: log.id,
        requestedStartTime: formatForInput(log.startTime),
        requestedEndTime: log.endTime ? formatForInput(log.endTime) : "",
      });
    }
  }, [log, reset]);

  const mutation = useMutation({
    mutationFn: requestTimeCorrection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      toast.success("Correction requested successfully.");
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit request.");
    },
  });

  const onSubmit = (data: CorrectionInput) => {
    mutation.mutate(data);
  };

  if (!log) return null;

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
            <div className="h-12 w-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <FileEdit className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Request Correction</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Propose changes to your timesheet log.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <input type="hidden" {...register("timeLogId")} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  Clock In
                </label>
                <input
                  type="datetime-local"
                  {...register("requestedStartTime")}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  Clock Out
                </label>
                <input
                  type="datetime-local"
                  {...register("requestedEndTime")}
                  className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:bg-muted/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Reason for Change
              </label>
              <textarea
                {...register("reason")}
                rows={3}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all hover:bg-muted/50"
                placeholder="e.g. Forgot to clock out before meeting..."
              />
              {errors.reason && <p className="text-xs text-destructive font-medium">{errors.reason.message}</p>}
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
                {mutation.isPending ? "Submitting..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
