
/**
 * Safely converts a value that might be null or undefined to a string
 */
export function safeString(value: string | null | undefined): string {
  return value || '';
}

/**
 * Safely converts a value that might be null or undefined to a number
 */
export function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return value;
}

/**
 * Safely converts a value that might be null or undefined to a date
 */
export function safeDate(value: string | number | Date | null | undefined): Date {
  if (value === null || value === undefined) return new Date();
  return new Date(value);
}

/**
 * Converts a value to type T[] regardless of its original type
 */
export function ensureArray<T>(value: T | T[] | null | undefined): T[] {
  if (value === null || value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Safely accesses potentially null objects
 */
export function safeAccess<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj === null || obj === undefined) return undefined;
  return obj[key];
}

/**
 * Checks if a value is safe to use (not null or undefined)
 */
export function isSafe<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Safely access environment variables
 */
export function safeEnv(name: string): string {
  const value = process.env[name] || '';
  return value;
}

/**
 * Non-null assertion with fallback value
 * This makes TypeScript happy while providing a fallback for runtime safety
 */
export function assertNonNull<T>(value: T | null | undefined, fallback: T): T {
  return (value !== null && value !== undefined) ? value : fallback;
}

/**
 * Safely convert Supabase count from possibly null to a number
 */
export function safeCount(count: number | null): number {
  return count !== null ? count : 0;
}
