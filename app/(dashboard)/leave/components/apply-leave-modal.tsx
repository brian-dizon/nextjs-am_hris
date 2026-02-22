"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { requestLeave } from "@/lib/actions/leave-actions";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CalendarPlus, AlertCircle, TrendingUp, HandCoins, Calendar } from "lucide-react";
import { toast } from "sonner";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { calculateNetWorkDays } from "@/lib/utils/date-utils";
import { getUserProfile } from "@/lib/actions/profile-actions";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const leaveTypes = ["VACATION", "SICK", "EARNED", "EMERGENCY"] as const;

const leaveRequestSchema = z.object({
  type: z.enum(leaveTypes),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  reason: z.string().min(10, "Reason must be at least 10 characters.").optional(),
});

type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

interface ApplyLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ApplyLeaveModal({ isOpen, onClose }: ApplyLeaveModalProps) {
  const queryClient = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [netDays, setNetDays] = useState(0);

  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => getUserProfile(),
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      type: "VACATION",
    },
  });

  const selectedLeaveType = watch("type");
  const availableBalance = profile?.leaveBalances.find(b => b.type === selectedLeaveType)?.balance || 0;

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const calculatedDays = calculateNetWorkDays(dateRange.from, dateRange.to);
      setNetDays(calculatedDays);
      setValue("startDate", format(dateRange.from, "yyyy-MM-dd"));
      setValue("endDate", format(dateRange.to, "yyyy-MM-dd"));
    } else {
      setNetDays(0);
      setValue("startDate", "");
      setValue("endDate", "");
    }
  }, [dateRange, setValue]);

  const mutation = useMutation({
    mutationFn: requestLeave,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] }); // Refresh profile to show updated balance/button
      queryClient.invalidateQueries({ queryKey: ["pending-approvals"] }); // Notify managers
      toast.success("Leave request submitted for approval.");
      reset();
      setDateRange(undefined); // Clear date picker
      setNetDays(0);
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to submit leave request.");
    },
  });

  const onSubmit = (data: LeaveRequestInput) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
        <div className="relative rounded-2xl border border-border bg-card p-8 shadow-xl max-h-[90vh] overflow-y-auto">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-6">
            <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CalendarPlus className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Apply for Leave</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Request time off for vacation, sick days, or other reasons.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Leave Type */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 text-foreground mb-1">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Leave Type
              </label>
              <select
                {...register("type")}
                className="block w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all hover:bg-muted/50"
              >
                {leaveTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Leave Dates */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 text-foreground mb-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                Date Range
              </label>
              <DateRangePicker onRangeChange={setDateRange} />
              {(errors.startDate || errors.endDate) && <p className="mt-1 text-xs text-destructive font-medium">Please select a valid date range.</p>}
            </div>

            {/* Net Days & Balance */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Days Requested (Net)</p>
                <p className={cn(
                  "text-xl font-bold tracking-tighter mt-1",
                  netDays > availableBalance ? "text-destructive" : "text-foreground"
                )}>
                  {netDays.toFixed(1)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[10px] font-bold uppercase text-muted-foreground">Available Balance</p>
                <p className="text-xl font-bold tracking-tighter mt-1">{availableBalance.toFixed(1)}</p>
              </div>
            </div>
            {netDays > availableBalance && <p className="mt-1 text-xs text-destructive font-medium">Requested days exceed available balance.</p>}
            {netDays <= 0 && dateRange?.from && dateRange?.to && <p className="mt-1 text-xs text-destructive font-medium">Please select a range with at least one working day.</p>}


            {/* Reason */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 text-foreground mb-1">
                <HandCoins className="h-4 w-4 text-muted-foreground" />
                Reason (Optional, but recommended)
              </label>
              <textarea
                {...register("reason")}
                rows={3}
                className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none transition-all hover:bg-muted/50"
                placeholder="e.g. Family vacation, personal appointment, etc."
              />
              {errors.reason && <p className="mt-1 text-xs text-destructive font-medium">{errors.reason.message}</p>}
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
                disabled={mutation.isPending || netDays <= 0 || netDays > availableBalance}
                className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all hover:bg-primary/90 disabled:opacity-50"
              >
                {mutation.isPending ? "Submitting Request..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
