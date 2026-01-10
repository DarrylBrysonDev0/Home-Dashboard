/**
 * Timezone utility functions using Luxon
 *
 * Handles conversion between UTC (database storage) and local timezones (display).
 * Uses IANA timezone identifiers (e.g., "America/New_York", "Europe/London").
 *
 * Design principle: Store all times in UTC, convert for display only.
 * This avoids timezone bugs, daylight saving time issues, and ensures consistent queries.
 */

import { DateTime } from "luxon";

/**
 * Convert a local time to UTC for database storage
 *
 * Takes a Date object that represents local time in the specified timezone
 * and converts it to a UTC Date object for storage in the database.
 *
 * @param localTime - Date object representing local time
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Date object in UTC
 *
 * @example
 * ```typescript
 * // User selects "January 15, 2026 at 6:00 PM EST"
 * const localTime = new Date("2026-01-15T18:00:00");
 * const utcTime = toUTC(localTime, "America/New_York");
 * // Returns: Date representing "2026-01-15T23:00:00Z" (6 PM EST = 11 PM UTC)
 * ```
 */
export function toUTC(localTime: Date, timezone: string): Date {
  return DateTime.fromJSDate(localTime, { zone: timezone }).toUTC().toJSDate();
}

/**
 * Convert a UTC time from database to local time for display
 *
 * Takes a Date object in UTC (from database) and converts it to the
 * specified local timezone, returning as a Date object.
 *
 * @param utcTime - Date object in UTC (from database)
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Date object in the specified timezone
 *
 * @example
 * ```typescript
 * // Database has: "2026-01-15T23:00:00Z"
 * const utcTime = new Date("2026-01-15T23:00:00Z");
 * const localTime = toLocalTime(utcTime, "America/New_York");
 * // Returns: Date representing "2026-01-15T18:00:00" in EST
 * ```
 */
export function toLocalTime(utcTime: Date, timezone: string): Date {
  return DateTime.fromJSDate(utcTime, { zone: "utc" })
    .setZone(timezone)
    .toJSDate();
}

/**
 * Format a UTC time for human-readable display in a specific timezone
 *
 * Converts UTC time to the specified timezone and formats it as:
 * "Wednesday, January 15 at 6:00 PM EST"
 *
 * @param utcTime - Date object in UTC (from database)
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @param format - Luxon format string (defaults to long date with time)
 * @returns Formatted string with timezone abbreviation
 *
 * @example
 * ```typescript
 * const utcTime = new Date("2026-01-15T23:00:00Z");
 * const formatted = formatForDisplay(utcTime, "America/New_York");
 * // Returns: "Wednesday, January 15 at 6:00 PM EST"
 * ```
 */
export function formatForDisplay(
  utcTime: Date,
  timezone: string,
  format: string = "EEEE, MMMM d 'at' h:mm a ZZZZ"
): string {
  return DateTime.fromJSDate(utcTime, { zone: "utc" })
    .setZone(timezone)
    .toFormat(format);
}

/**
 * Get the current date/time in a specific timezone
 *
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Date object representing current time in the specified timezone
 *
 * @example
 * ```typescript
 * const nowInNY = getCurrentTimeInZone("America/New_York");
 * const nowInLondon = getCurrentTimeInZone("Europe/London");
 * ```
 */
export function getCurrentTimeInZone(timezone: string): Date {
  return DateTime.now().setZone(timezone).toJSDate();
}

/**
 * Check if a timezone identifier is valid
 *
 * @param timezone - Timezone identifier to validate
 * @returns True if the timezone is valid, false otherwise
 *
 * @example
 * ```typescript
 * isValidTimezone("America/New_York"); // true
 * isValidTimezone("Invalid/Timezone"); // false
 * ```
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    DateTime.now().setZone(timezone);
    return DateTime.now().setZone(timezone).isValid;
  } catch {
    return false;
  }
}

/**
 * Get the timezone abbreviation for a specific timezone at a given time
 *
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @param date - Date to get the abbreviation for (defaults to now)
 * @returns Timezone abbreviation (e.g., "EST", "EDT", "PST")
 *
 * @example
 * ```typescript
 * // During winter (EST)
 * getTimezoneAbbreviation("America/New_York", new Date("2026-01-15"));
 * // Returns: "EST"
 *
 * // During summer (EDT)
 * getTimezoneAbbreviation("America/New_York", new Date("2026-07-15"));
 * // Returns: "EDT"
 * ```
 */
export function getTimezoneAbbreviation(
  timezone: string,
  date: Date = new Date()
): string {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .setZone(timezone)
    .toFormat("ZZZZ");
}

/**
 * Common timezone identifiers for household use
 */
export const COMMON_TIMEZONES = {
  EASTERN: "America/New_York",
  CENTRAL: "America/Chicago",
  MOUNTAIN: "America/Denver",
  PACIFIC: "America/Los_Angeles",
  UTC: "UTC",
} as const;

/**
 * Default timezone for the application
 * Can be overridden via environment variable: DEFAULT_TIMEZONE
 */
export const DEFAULT_TIMEZONE =
  process.env.DEFAULT_TIMEZONE || COMMON_TIMEZONES.EASTERN;
