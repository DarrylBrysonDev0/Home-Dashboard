"use client";

import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { TREND_COLORS, type TrendColorKey } from "@/lib/constants/colors";
import type { Trend } from "@/lib/validations/analytics";

/**
 * Value format types for KPI display
 */
export type KPIValueFormat = "currency" | "percentage" | "number";

/**
 * Value color options for semantic highlighting
 */
export type KPIValueColor = "default" | "positive" | "negative" | "auto";

/**
 * Cemdash KPI card types with gradient borders
 * - coral: Expenses, Net Spending (red/coral gradient)
 * - mint: Income, Positive Cash Flow (green gradient)
 * - teal: Total Balance, Account Totals (teal→cyan gradient)
 * - cyan: Informational, Savings Rate (cyan gradient)
 * - purple: Budget, Goals (purple gradient)
 * - neutral: Default, No Emphasis (no gradient)
 */
export type KPICardType = "coral" | "mint" | "teal" | "cyan" | "purple" | "neutral";

/**
 * Props for the KPICard component
 */
export interface KPICardProps {
  /** Card title/label */
  title: string;
  /** Main value to display (null for empty state) */
  value: number | null;
  /** Format for displaying the value */
  format?: KPIValueFormat;
  /** Trend direction for the indicator */
  trend?: Trend;
  /** Trend percentage change (displayed next to trend icon) */
  trendValue?: number;
  /** Whether a positive trend is good (true for income, false for expenses) */
  positiveIsGood?: boolean;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Optional description text */
  description?: string;
  /** Optional tooltip text for additional context */
  tooltip?: string;
  /** Optional icon to display (LucideIcon or ReactNode) */
  icon?: LucideIcon | ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether the card is in loading state */
  isLoading?: boolean;
  /** Color styling for the value */
  valueColor?: KPIValueColor;
  /** Cemdash card type for gradient border and glow effects */
  cardType?: KPICardType;
}

/**
 * Formats a number as currency (USD) with 2 decimal places
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats a number as a percentage
 */
function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

/**
 * Formats a number with thousands separator
 */
function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/**
 * Returns the formatted value based on the format type
 */
function formatValue(value: number, format: KPIValueFormat): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percentage":
      return formatPercentage(value);
    case "number":
      return formatNumber(value);
    default:
      return String(value);
  }
}

/**
 * Gets the trend icon component based on direction
 */
function getTrendIcon(trend: Trend): LucideIcon {
  switch (trend) {
    case "up":
      return TrendingUp;
    case "down":
      return TrendingDown;
    case "neutral":
      return Minus;
  }
}

/**
 * Gets the semantic color key based on trend direction and whether positive is good
 */
function getTrendColorKey(trend: Trend, positiveIsGood: boolean): TrendColorKey {
  if (trend === "neutral") return "neutral";

  // If trend is up and positive is good, or trend is down and positive is not good
  if ((trend === "up" && positiveIsGood) || (trend === "down" && !positiveIsGood)) {
    return "positive";
  }

  return "negative";
}

/**
 * Gets the accessible label for the trend indicator
 */
function getTrendAriaLabel(
  trend: Trend,
  trendValue: number | undefined,
  positiveIsGood: boolean
): string {
  const direction = trend === "up" ? "increased" : trend === "down" ? "decreased" : "unchanged";
  const sentiment = getTrendColorKey(trend, positiveIsGood) === "positive"
    ? "which is favorable"
    : getTrendColorKey(trend, positiveIsGood) === "negative"
    ? "which is unfavorable"
    : "";

  const valueStr = trendValue !== undefined ? ` by ${Math.abs(trendValue).toFixed(1)}%` : "";

  return `${direction}${valueStr}${sentiment ? `, ${sentiment}` : ""}`;
}

/**
 * Gets the value color class based on valueColor prop and actual value
 */
function getValueColorClass(valueColor: KPIValueColor | undefined, value: number | null): string {
  if (!valueColor || valueColor === "default" || value === null) {
    return "";
  }

  if (valueColor === "auto") {
    if (value > 0) return "text-emerald-600";
    if (value < 0) return "text-coral-600";
    return "";
  }

  if (valueColor === "positive") return "text-emerald-600";
  if (valueColor === "negative") return "text-coral-600";

  return "";
}

/**
 * KPICard - Displays a key performance indicator metric with optional trend indicator
 *
 * Used in the dashboard to show financial health summary metrics:
 * - Net Cash Flow
 * - Total Balance
 * - Month-over-Month Change
 * - Recurring Expenses
 * - Largest Expense
 */
export function KPICard({
  title,
  value,
  format = "currency",
  trend,
  trendValue,
  positiveIsGood = true,
  subtitle,
  description,
  tooltip,
  icon,
  className,
  isLoading = false,
  valueColor,
  cardType,
}: KPICardProps) {
  const TrendIcon = trend ? getTrendIcon(trend) : null;
  const trendColorKey = trend ? getTrendColorKey(trend, positiveIsGood) : null;
  const trendColor = trendColorKey ? TREND_COLORS[trendColorKey] : undefined;
  const trendAriaLabel = trend
    ? getTrendAriaLabel(trend, trendValue, positiveIsGood)
    : undefined;

  // Get the trend CSS class for the indicator
  const getTrendColorClass = (colorKey: TrendColorKey | null): string => {
    if (!colorKey) return "";
    switch (colorKey) {
      case "positive":
        return "text-emerald-600";
      case "negative":
        return "text-coral-600";
      case "neutral":
        return "text-gray-500";
      default:
        return "";
    }
  };

  // Render the icon - supports both LucideIcon and ReactNode
  const renderIcon = () => {
    if (!icon) return null;

    // Check if it's a React element (ReactNode)
    if (typeof icon === "object" && "type" in (icon as object)) {
      return icon;
    }

    // It's a LucideIcon component
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="h-4 w-4" aria-hidden="true" />;
  };

  // Build Cemdash KPI card classes for gradient borders and glow effects
  const kpiCardClasses = cardType
    ? cn("kpi-card", `kpi-card--${cardType}`)
    : "";

  const cardContent = (
    <Card
      className={cn(
        "relative overflow-hidden",
        kpiCardClasses,
        className
      )}
      role="article"
      aria-label={`${title} KPI card`}
    >
      <CardHeader className="pb-2">
        <CardTitle 
          className="flex items-center gap-2 text-sm font-medium text-muted-foreground"
          role="heading"
          aria-level={3}
        >
          {renderIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-24" data-testid="kpi-skeleton" />
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span 
                className={cn(
                  "text-2xl font-bold tracking-tight",
                  getValueColorClass(valueColor, value)
                )}
                data-testid="kpi-value"
              >
                {value === null ? "—" : formatValue(value, format)}
              </span>

              {trend && TrendIcon && !isLoading && (
                <div
                  className={cn("flex items-center gap-1", getTrendColorClass(trendColorKey))}
                  aria-label={trendAriaLabel}
                  role="img"
                  data-testid="trend-indicator"
                >
                  <TrendIcon
                    className="h-4 w-4"
                    aria-hidden="true"
                  />
                  {trendValue !== undefined && (
                    <span className="text-sm font-medium">
                      {trendValue > 0 ? "+" : ""}
                      {trendValue.toFixed(1)}%
                    </span>
                  )}
                </div>
              )}
            </div>

            {subtitle && (
              <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
            )}
            
            {description && (
              <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );

  // Wrap with tooltip if provided
  if (tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return cardContent;
}
