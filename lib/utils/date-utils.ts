import { isWeekend, differenceInDays, addDays } from "date-fns";

/**
 * Calculates the number of working days between two dates, inclusive.
 * Excludes weekends.
 */
export function calculateNetWorkDays(startDate: Date, endDate: Date): number {
  let count = 0;
  let currentDate = startDate;

  while (currentDate <= endDate) {
    if (!isWeekend(currentDate)) {
      count++;
    }
    currentDate = addDays(currentDate, 1);
  }

  return count;
}
