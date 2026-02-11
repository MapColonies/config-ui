import { useState } from "react";
import { format, parseISO, startOfDay, endOfDay } from "date-fns";
import { CalendarIcon, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type DateRangeFilterPopoverProps = {
  createdAfter?: string;
  createdBefore?: string;
  onCreatedAfterChange: (value: string | undefined) => void;
  onCreatedBeforeChange: (value: string | undefined) => void;
};

export function DateRangeFilterPopover({
  createdAfter,
  createdBefore,
  onCreatedAfterChange,
  onCreatedBeforeChange,
}: DateRangeFilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeField, setActiveField] = useState<"after" | "before" | null>(
    null
  );

  const afterDate = createdAfter ? parseISO(createdAfter) : undefined;
  const beforeDate = createdBefore ? parseISO(createdBefore) : undefined;

  const handleAfterSelect = (date: Date | undefined) => {
    onCreatedAfterChange(date ? startOfDay(date).toISOString() : undefined);
    setActiveField(null);
  };

  const handleBeforeSelect = (date: Date | undefined) => {
    onCreatedBeforeChange(date ? endOfDay(date).toISOString() : undefined);
    setActiveField(null);
  };

  const handleClearAll = () => {
    onCreatedAfterChange(undefined);
    onCreatedBeforeChange(undefined);
    setActiveField(null);
  };

  const hasFilters = createdAfter || createdBefore;

  // Build trigger label
  const getTriggerLabel = () => {
    if (afterDate && beforeDate) {
      return `${format(afterDate, "LLL dd")} - ${format(beforeDate, "LLL dd")}`;
    }
    if (afterDate) {
      return `After ${format(afterDate, "LLL dd, y")}`;
    }
    if (beforeDate) {
      return `Before ${format(beforeDate, "LLL dd, y")}`;
    }
    return "Filter by date";
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[200px] justify-start text-left font-normal",
            !hasFilters && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          <span className="truncate">{getTriggerLabel()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="end">
        <div className="flex flex-col">
          {/* Date field selectors */}
          <div className="flex border-b">
            <button
              type="button"
              onClick={() =>
                setActiveField(activeField === "after" ? null : "after")
              }
              className={cn(
                "w-1/2 px-4 py-3 text-sm text-left hover:bg-muted/50 transition-colors",
                activeField === "after" && "bg-muted"
              )}
            >
              <div className="text-muted-foreground text-xs mb-0.5">After</div>
              <div className="flex items-center justify-between">
                <span className={cn(!afterDate && "text-muted-foreground")}>
                  {afterDate ? format(afterDate, "LLL dd, y") : "Select date"}
                </span>
                {afterDate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreatedAfterChange(undefined);
                    }}
                    className="ml-2 p-0.5 hover:bg-muted rounded"
                    aria-label="Clear after date"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </button>
            <div className="w-px bg-border" />
            <button
              type="button"
              onClick={() =>
                setActiveField(activeField === "before" ? null : "before")
              }
              className={cn(
                "w-1/2 px-4 py-3 text-sm text-left hover:bg-muted/50 transition-colors",
                activeField === "before" && "bg-muted"
              )}
            >
              <div className="text-muted-foreground text-xs mb-0.5">Before</div>
              <div className="flex items-center justify-between">
                <span className={cn(!beforeDate && "text-muted-foreground")}>
                  {beforeDate ? format(beforeDate, "LLL dd, y") : "Select date"}
                </span>
                {beforeDate && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreatedBeforeChange(undefined);
                    }}
                    className="ml-2 p-0.5 hover:bg-muted rounded"
                    aria-label="Clear before date"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </button>
          </div>

          {/* Calendar - shown when a field is active */}
          {activeField && (
            <Calendar
              mode="single"
              selected={activeField === "after" ? afterDate : beforeDate}
              onSelect={
                activeField === "after" ? handleAfterSelect : handleBeforeSelect
              }
              defaultMonth={activeField === "after" ? afterDate : beforeDate}
              disabled={
                activeField === "after"
                  ? beforeDate
                    ? { after: beforeDate }
                    : undefined
                  : afterDate
                    ? { before: afterDate }
                    : undefined
              }
              initialFocus
            />
          )}

          {/* Clear all button */}
          {hasFilters && (
            <div className="border-t p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleClearAll}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
