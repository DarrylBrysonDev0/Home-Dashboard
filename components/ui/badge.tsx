import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent-coral focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-bg-tertiary text-text-secondary hover:bg-bg-hover",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border-default",
        // Semantic variants (Cemdash)
        positive:
          "border-positive/30 bg-positive/20 text-positive",
        negative:
          "border-negative/30 bg-negative/20 text-negative",
        warning:
          "border-warning/30 bg-warning/20 text-warning",
        info:
          "border-info/30 bg-info/20 text-info",
        // Transaction type variants
        income:
          "border-positive/30 bg-positive/20 text-positive",
        expense:
          "border-negative/30 bg-negative/20 text-negative",
        transfer:
          "border-info/30 bg-info/20 text-info",
        // Category variants (Cemdash)
        charity:
          "border-category-charity/30 bg-category-charity/20 text-category-charity",
        daily:
          "border-category-daily/30 bg-category-daily/20 text-category-daily",
        dining:
          "border-category-dining/30 bg-category-dining/20 text-category-dining",
        entertainment:
          "border-category-entertainment/30 bg-category-entertainment/20 text-category-entertainment",
        gifts:
          "border-category-gifts/30 bg-category-gifts/20 text-category-gifts",
        groceries:
          "border-category-groceries/30 bg-category-groceries/20 text-category-groceries",
        healthcare:
          "border-category-healthcare/30 bg-category-healthcare/20 text-category-healthcare",
        financing:
          "border-category-financing/30 bg-category-financing/20 text-category-financing",
        shopping:
          "border-category-shopping/30 bg-category-shopping/20 text-category-shopping",
        subscriptions:
          "border-category-subscriptions/30 bg-category-subscriptions/20 text-category-subscriptions",
        transportation:
          "border-category-transportation/30 bg-category-transportation/20 text-category-transportation",
        travel:
          "border-category-travel/30 bg-category-travel/20 text-category-travel",
        utilities:
          "border-category-utilities/30 bg-category-utilities/20 text-category-utilities",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
