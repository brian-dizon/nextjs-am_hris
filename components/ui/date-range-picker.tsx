"use client";

import * as React from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  className?: string;
  onRangeChange: (range: DateRange | undefined) => void;
}

export function DateRangePicker({
  className,
  onRangeChange,
}: DateRangePickerProps) {
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  const handleSelect = (range: DateRange | undefined) => {
    setDate(range);
    onRangeChange(range);
  };

  const setShortcut = (type: "this-month" | "last-month" | "last-30") => {
    let range: DateRange;
    const today = new Date();
    
    switch (type) {
      case "this-month":
        range = { from: startOfMonth(today), to: today };
        break;
      case "last-month":
        const lastMonth = subMonths(today, 1);
        range = { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) };
        break;
      case "last-30":
        range = { from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), to: today };
        break;
    }
    
    setDate(range);
    onRangeChange(range);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[280px] justify-start text-left font-normal rounded-xl border-border h-10 shadow-sm",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd")} - {format(date.to, "LLL dd, yyyy")}
                </>
              ) : (
                format(date.from, "LLL dd, yyyy")
              )
            ) : (
              <span>Pick a date</span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 flex flex-col md:flex-row rounded-2xl overflow-hidden" align="end">
          {/* Sidebar Shortcuts */}
          <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-border p-3 bg-muted/20 min-w-[140px]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-2 mb-1">Presets</p>
            <Button 
              variant="ghost" 
              size="sm"
              className="justify-start font-medium text-xs rounded-lg"
              onClick={() => setShortcut("this-month")}
            >
              This Month
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="justify-start font-medium text-xs rounded-lg"
              onClick={() => setShortcut("last-month")}
            >
              Last Month
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="justify-start font-medium text-xs rounded-lg"
              onClick={() => setShortcut("last-30")}
            >
              Last 30 Days
            </Button>
          </div>
          
          <div className="p-1">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={handleSelect}
              numberOfMonths={1}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
