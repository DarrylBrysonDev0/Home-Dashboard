"use client";

/**
 * Providers Component
 *
 * Client-side providers wrapper for the application.
 * This component wraps all client-side context providers needed by the app.
 *
 * Currently provides:
 * - SessionProvider from NextAuth.js for authentication state
 *
 * @see lib/auth.ts for NextAuth configuration
 */

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers wrapper component
 *
 * Must be a client component to use React Context providers.
 * Imported by the root layout (server component).
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}
