/**
 * Centralized API Error Handling Utilities
 *
 * Provides consistent error responses across all API routes:
 * - Standardized error response format
 * - Typed error codes for programmatic handling
 * - Zod validation error formatting
 * - Environment-aware error details
 *
 * Response Format:
 * {
 *   error: string;           // Human-readable message
 *   code: ApiErrorCode;      // Machine-readable error code
 *   details?: object;        // Additional context (validation errors, etc.)
 * }
 */

import { NextResponse } from "next/server";
import { ZodError, ZodIssue } from "zod";

/**
 * Standardized error codes for API responses
 *
 * These codes allow clients to programmatically handle different error types
 * without parsing error message strings.
 */
export type ApiErrorCode =
  | "VALIDATION_ERROR" // Invalid request parameters (400)
  | "NOT_FOUND" // Resource not found (404)
  | "DATABASE_ERROR" // Database query failed (500)
  | "INTERNAL_ERROR"; // Unexpected server error (500)

/**
 * API error response shape - consistent across all endpoints
 */
export interface ApiErrorResponse {
  error: string;
  code: ApiErrorCode;
  details?: ValidationErrorDetails | Record<string, unknown>;
}

/**
 * Validation error details - maps field paths to error messages
 */
export interface ValidationErrorDetails {
  fields: Record<string, string[]>;
}

/**
 * Options for error response customization
 */
interface ErrorResponseOptions {
  /** Log the error to console (default: true for 500 errors) */
  logError?: boolean;
  /** Additional context for logging */
  context?: string;
  /** The original error object for logging */
  cause?: unknown;
}

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Format Zod validation errors into a structured format
 *
 * Groups errors by field path for easier client-side handling:
 * { fields: { "start_date": ["Invalid date format"], "limit": ["Must be positive"] } }
 */
function formatZodErrors(zodError: ZodError): ValidationErrorDetails {
  const fields: Record<string, string[]> = {};

  for (const issue of zodError.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "_root";

    if (!fields[path]) {
      fields[path] = [];
    }
    fields[path].push(issue.message);
  }

  return { fields };
}

/**
 * Create a human-readable summary of Zod validation errors
 */
function summarizeZodErrors(issues: ZodIssue[]): string {
  if (issues.length === 0) {
    return "Validation failed";
  }

  if (issues.length === 1) {
    const issue = issues[0];
    const path = issue.path.length > 0 ? `${issue.path.join(".")}: ` : "";
    return `${path}${issue.message}`;
  }

  // Multiple errors - show count and first error
  const firstIssue = issues[0];
  const path = firstIssue.path.length > 0 ? `${firstIssue.path.join(".")}: ` : "";
  return `${path}${firstIssue.message} (and ${issues.length - 1} more error${issues.length > 2 ? "s" : ""})`;
}

/**
 * Log an error with consistent formatting
 */
function logApiError(
  message: string,
  code: ApiErrorCode,
  options?: ErrorResponseOptions
): void {
  const prefix = options?.context ? `[${options.context}]` : "[API]";
  const errorInfo = options?.cause instanceof Error ? options.cause.message : "";

  console.error(
    `${prefix} ${code}: ${message}${errorInfo ? ` - ${errorInfo}` : ""}`
  );

  // In development, log full stack trace for debugging
  if (isDevelopment && options?.cause instanceof Error && options.cause.stack) {
    console.error(options.cause.stack);
  }
}

/**
 * Create a validation error response (HTTP 400)
 *
 * @param zodError - The Zod validation error
 * @param options - Optional configuration
 * @returns NextResponse with standardized error format
 *
 * @example
 * const parsed = schema.safeParse(params);
 * if (!parsed.success) {
 *   return validationError(parsed.error);
 * }
 */
export function validationError(
  zodError: ZodError,
  options?: ErrorResponseOptions
): NextResponse<ApiErrorResponse> {
  const message = summarizeZodErrors(zodError.issues);
  const details = formatZodErrors(zodError);

  if (options?.logError) {
    logApiError(message, "VALIDATION_ERROR", options);
  }

  return NextResponse.json(
    {
      error: message,
      code: "VALIDATION_ERROR" as const,
      details,
    },
    { status: 400 }
  );
}

/**
 * Create a not found error response (HTTP 404)
 *
 * @param resource - Description of what wasn't found
 * @param options - Optional configuration
 * @returns NextResponse with standardized error format
 *
 * @example
 * const pattern = await findPattern(id);
 * if (!pattern) {
 *   return notFoundError("Recurring pattern");
 * }
 */
export function notFoundError(
  resource: string,
  options?: ErrorResponseOptions
): NextResponse<ApiErrorResponse> {
  const message = `${resource} not found`;

  if (options?.logError) {
    logApiError(message, "NOT_FOUND", options);
  }

  return NextResponse.json(
    {
      error: message,
      code: "NOT_FOUND" as const,
    },
    { status: 404 }
  );
}

/**
 * Create a database error response (HTTP 500)
 *
 * @param operation - Description of the failed operation
 * @param options - Optional configuration
 * @returns NextResponse with standardized error format
 *
 * @example
 * try {
 *   const data = await prisma.transaction.findMany();
 * } catch (error) {
 *   return databaseError("fetching transactions", { cause: error });
 * }
 */
export function databaseError(
  operation: string,
  options?: ErrorResponseOptions
): NextResponse<ApiErrorResponse> {
  const message = `Failed to ${operation}`;

  // Always log database errors
  logApiError(message, "DATABASE_ERROR", { ...options, logError: true });

  return NextResponse.json(
    {
      error: message,
      code: "DATABASE_ERROR" as const,
    },
    { status: 500 }
  );
}

/**
 * Create an internal server error response (HTTP 500)
 *
 * Use this for unexpected errors that don't fit other categories.
 *
 * @param message - Human-readable error message
 * @param options - Optional configuration
 * @returns NextResponse with standardized error format
 *
 * @example
 * try {
 *   // Complex operation
 * } catch (error) {
 *   return internalError("An unexpected error occurred", { cause: error });
 * }
 */
export function internalError(
  message: string = "An unexpected error occurred",
  options?: ErrorResponseOptions
): NextResponse<ApiErrorResponse> {
  // Always log internal errors
  logApiError(message, "INTERNAL_ERROR", { ...options, logError: true });

  return NextResponse.json(
    {
      error: message,
      code: "INTERNAL_ERROR" as const,
    },
    { status: 500 }
  );
}

/**
 * Determine the appropriate error response for a caught exception
 *
 * This is a convenience function for catch blocks that analyzes the error
 * and returns the most appropriate response type.
 *
 * @param error - The caught error
 * @param operation - Description of what was being attempted
 * @param options - Optional configuration
 * @returns NextResponse with standardized error format
 *
 * @example
 * try {
 *   const result = await fetchData();
 *   return NextResponse.json({ data: result });
 * } catch (error) {
 *   return handleApiError(error, "fetch KPIs", { context: "KPIs API" });
 * }
 */
export function handleApiError(
  error: unknown,
  operation: string,
  options?: ErrorResponseOptions
): NextResponse<ApiErrorResponse> {
  // Check for Prisma-specific errors
  if (
    error instanceof Error &&
    (error.name === "PrismaClientKnownRequestError" ||
      error.name === "PrismaClientUnknownRequestError" ||
      error.name === "PrismaClientInitializationError" ||
      error.message.includes("prisma") ||
      error.message.includes("database"))
  ) {
    return databaseError(operation, { ...options, cause: error });
  }

  // Default to internal error
  return internalError(`Failed to ${operation}`, { ...options, cause: error });
}
