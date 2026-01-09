/**
 * ConfidenceBadge - Visual indicator for recurring transaction confidence levels
 *
 * Displays High/Medium/Low confidence with appropriate colors based on
 * the recurring detection algorithm's confidence score.
 *
 * Color coding (from lib/constants/colors.ts):
 * - High (90-100%): Green - highly reliable recurring pattern
 * - Medium (70-89%): Amber - likely recurring but some variation
 * - Low (50-69%): Gray - possible recurring, needs verification
 */

import { cn } from "@/lib/utils";
import type { ConfidenceLevel } from "@/lib/validations/analytics";

/**
 * Props for ConfidenceBadge component
 */
export interface ConfidenceBadgeProps {
  /** Confidence level: High, Medium, or Low */
  level: ConfidenceLevel;
  /** Optional numeric score to display (50-100) */
  score?: number;
  /** Whether to show the score alongside the level */
  showScore?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Style mappings for each confidence level
 */
const CONFIDENCE_STYLES: Record<
  ConfidenceLevel,
  { bg: string; text: string; border: string }
> = {
  High: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-800 dark:text-green-200",
    border: "border-green-200 dark:border-green-800",
  },
  Medium: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-800 dark:text-amber-200",
    border: "border-amber-200 dark:border-amber-800",
  },
  Low: {
    bg: "bg-gray-100 dark:bg-gray-800/50",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
  },
};

/**
 * ConfidenceBadge component
 *
 * Displays a color-coded badge indicating the confidence level of a detected
 * recurring transaction pattern. Optionally shows the numeric score.
 *
 * @example
 * // Basic usage
 * <ConfidenceBadge level="High" />
 *
 * @example
 * // With score display
 * <ConfidenceBadge level="Medium" score={75} showScore />
 */
export function ConfidenceBadge({
  level,
  score,
  showScore = false,
  className,
}: ConfidenceBadgeProps) {
  const styles = CONFIDENCE_STYLES[level];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles.bg,
        styles.text,
        styles.border,
        className
      )}
      role="status"
      aria-label={`Confidence level: ${level}${showScore && score !== undefined ? `, score: ${score}%` : ""}`}
    >
      <span className="sr-only">Confidence:</span>
      {level}
      {showScore && score !== undefined && (
        <span className="opacity-75">({score}%)</span>
      )}
    </span>
  );
}
