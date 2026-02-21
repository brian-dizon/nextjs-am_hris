"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getActiveTimeLog, clockIn, clockOut } from "@/lib/actions/timer-actions";

export function useTimer() {
  const queryClient = useQueryClient();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Fetch the active log
  const { data: activeLog, isLoading } = useQuery({
    queryKey: ["active-timer"],
    queryFn: () => getActiveTimeLog(),
  });

  // Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: clockIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-timer"] });
    },
  });

  // Clock Out Mutation
  const clockOutMutation = useMutation({
    mutationFn: clockOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-timer"] });
      setElapsedSeconds(0);
    },
  });

  // Ticking Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeLog && !activeLog.endTime) {
      const startTime = new Date(activeLog.startTime).getTime();
      
      // Update immediately
      const now = new Date().getTime();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));

      interval = setInterval(() => {
        const now = new Date().getTime();
        setElapsedSeconds(Math.floor((now - startTime) / 1000));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeLog]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((v) => v < 10 ? "0" + v : v)
      .join(":");
  };

  return {
    activeLog,
    isLoading,
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    isClockingIn: clockInMutation.isPending,
    isClockingOut: clockOutMutation.isPending,
    handleClockIn: () => clockInMutation.mutate(),
    handleClockOut: () => clockOutMutation.mutate(),
  };
}
