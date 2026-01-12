import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-coral focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Primary - Coral accent with glow in dark mode
        default:
          "bg-accent-coral text-text-inverse shadow-sm hover:bg-accent-coral-hover active:scale-[0.98] dark:shadow-glow-coral dark:hover:shadow-glow-coral-intense",
        // Destructive - Negative/red styling
        destructive:
          "bg-negative text-text-inverse shadow-sm hover:brightness-110 active:brightness-90",
        // Outline - Border only, transparent background
        outline:
          "border border-border-default bg-transparent text-text-primary shadow-sm hover:bg-bg-hover hover:border-border-emphasis active:bg-bg-active",
        // Secondary - Tertiary background with border
        secondary:
          "bg-bg-tertiary text-text-primary border border-border-default shadow-sm hover:bg-bg-hover hover:border-border-emphasis active:bg-bg-active",
        // Ghost - Minimal styling, no border
        ghost:
          "text-text-secondary hover:bg-bg-hover hover:text-text-primary active:bg-bg-active",
        // Link - Underline on hover
        link: "text-accent-coral underline-offset-4 hover:underline",
        // Period - Time period button (inactive state) for sidebar filters
        period:
          "border border-transparent bg-transparent text-text-secondary hover:bg-bg-hover hover:border-border-subtle active:bg-bg-active",
        // Period Active - Time period button (active state) with coral accent
        periodActive:
          "border border-accent-coral bg-bg-hover text-text-primary dark:shadow-glow-coral",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
