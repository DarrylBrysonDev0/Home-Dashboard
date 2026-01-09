"use client";

import * as React from "react";
import { format, parse, isValid, isBefore, isAfter } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuickDateRange, DateRange } from "@/lib/constants/date-ranges";
import { formatDateRangeDisplay } from "@/lib/constants/date-ranges";

/**
 * TimeFilter Component Props
 */
export interface TimeFilterProps {
  /** Available quick-select date ranges */
  ranges: readonly QuickDateRange[] | QuickDateRange[];
  /** Currently selected range key */
  selectedKey: string;
  /** Custom date range when selectedKey is "custom" */
  customRange?: DateRange;
  /** Called when a range is selected */
  onChange: (key: string, range: DateRange) => void;
  /** Show loading skeleton */
  isLoading?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * TimeFilter Component
 *
 * Displays quick-select buttons for predefined date ranges and
 * a custom date picker for arbitrary date selections.
 */
export function TimeFilter({
  ranges,
  selectedKey,
  customRange,
  onChange,
  isLoading = false,
  className,
}: TimeFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = React.useState(false);
  const [customStartDate, setCustomStartDate] = React.useState<string>("");
  const [customEndDate, setCustomEndDate] = React.useState<string>("");
  const [dateError, setDateError] = React.useState<string | null>(null);

  // Initialize custom dates when opening the picker or when customRange changes
  React.useEffect(() => {
    if (customRange) {
      setCustomStartDate(format(customRange.start, "yyyy-MM-dd"));
      setCustomEndDate(format(customRange.end, "yyyy-MM-dd"));
    }
  }, [customRange]);

  // Validate dates whenever they change
  React.useEffect(() => {
    if (customStartDate && customEndDate) {
      const start = parse(customStartDate, "yyyy-MM-dd", new Date());
      const end = parse(customEndDate, "yyyy-MM-dd", new Date());

      if (isValid(start) && isValid(end) && isAfter(start, end)) {
        setDateError("End date must be after start date");
      } else {
        setDateError(null);
      }
    } else {
      setDateError(null);
    }
  }, [customStartDate, customEndDate]);

  const handleQuickSelect = (range: QuickDateRange) => {
    // Don't fire onChange if already selected
    if (range.key === selectedKey) return;
    onChange(range.key, range.getValue());
  };

  const handleApplyCustom = () => {
    const start = parse(customStartDate, "yyyy-MM-dd", new Date());
    const end = parse(customEndDate, "yyyy-MM-dd", new Date());

    if (isValid(start) && isValid(end) && !isAfter(start, end)) {
      onChange("custom", { start, end });
      setIsCustomOpen(false);
    }
  };

  const isApplyDisabled =
    !customStartDate ||
    !customEndDate ||
    dateError !== null ||
    !isValid(parse(customStartDate, "yyyy-MM-dd", new Date())) ||
    !isValid(parse(customEndDate, "yyyy-MM-dd", new Date()));

  // Format custom button text - always include "Custom" for accessibility
  const getCustomButtonText = () => {
    if (selectedKey === "custom" && customRange) {
      return `Custom: ${formatDateRangeDisplay(customRange)}`;
    }
    return "Custom";
  };

  // Show skeleton overlay when loading
  if (isLoading) {
    return (
      <div
        data-testid="time-filter-skeleton"
        className={cn("flex flex-wrap gap-2", className)}
        role="group"
        aria-label="Filter by time period (loading)"
      >
        {/* Render disabled buttons for loading state */}
        {ranges.map((range) => (
          <Button
            key={range.key}
            variant="outline"
            size="sm"
            disabled={true}
            aria-pressed={false}
          >
            {range.label}
          </Button>
        ))}
        <Button variant="outline" size="sm" disabled={true}>
          <CalendarIcon className="h-4 w-4" />
          Custom
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-wrap gap-2", className)}
      role="group"
      aria-label="Filter by time period"
    >
      {/* Quick-select buttons */}
      {ranges.map((range) => (
        <Button
          key={range.key}
          variant={selectedKey === range.key ? "default" : "outline"}
          size="sm"
          onClick={() => handleQuickSelect(range)}
          disabled={isLoading}
          data-active={selectedKey === range.key}
          aria-pressed={selectedKey === range.key}
        >
          {range.label}
        </Button>
      ))}

      {/* Custom date range picker */}
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selectedKey === "custom" ? "default" : "outline"}
            size="sm"
            disabled={isLoading}
            data-active={selectedKey === "custom"}
            aria-pressed={selectedKey === "custom"}
            className={cn("gap-2", selectedKey === "custom" && "min-w-fit")}
          >
            <CalendarIcon className="h-4 w-4" />
            {getCustomButtonText()}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-4"
          align="start"
          role="dialog"
          aria-label="Custom date range picker"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="start-date-input"
                className="text-sm font-medium leading-none"
              >
                Start Date
              </label>
              <Input
                id="start-date-input"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                aria-label="Start date"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="end-date-input"
                className="text-sm font-medium leading-none"
              >
                End Date
              </label>
              <Input
                id="end-date-input"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                aria-label="End date"
                className="w-full"
              />
            </div>

            {dateError && (
              <p className="text-sm text-destructive" role="alert">
                {dateError}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCustomOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApplyCustom}
                disabled={isApplyDisabled}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
