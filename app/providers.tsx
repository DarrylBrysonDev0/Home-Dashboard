"use client";

/**
 * Providers Component
 *
 * Client-side providers wrapper for the application.
 * This component wraps all client-side context providers needed by the app.
 *
 * Currently provides:
 * - ThemeProvider for light/dark theme switching
 * - SessionProvider from NextAuth.js for authentication state
 * - TooltipProvider from Radix UI for tooltip support
 *
 * @see lib/auth.ts for NextAuth configuration
 * @see components/theme/ThemeProvider.tsx for theme configuration
 */

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TooltipProvider } from "@/components/ui/tooltip";

export interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers wrapper component
 *
 * Must be a client component to use React Context providers.
 * Imported by the root layout (server component).
 *
 * Provider order (outer to inner):
 * 1. ThemeProvider - theme context available to all components
 * 2. SessionProvider - auth state available to all components
 * 3. TooltipProvider - enables Radix UI tooltips throughout the app
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <TooltipProvider delayDuration={300}>
          {children}
        </TooltipProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
