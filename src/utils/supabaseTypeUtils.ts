
import { PostgrestError } from "@supabase/supabase-js";

export function isError<T>(
  result: T | { error: PostgrestError }
): result is { error: PostgrestError } {
  return (result as { error?: PostgrestError }).error !== undefined;
}

export function ensureResult<T>(
  result: T | { error: PostgrestError } | null | undefined
): T {
  if (!result || isError(result)) {
    throw new Error(
      isError(result) ? result.error.message : "No result returned"
    );
  }
  return result as T;
}

export function assertType<T>(): (value: unknown) => T {
  return (value: unknown): T => {
    return value as T;
  };
}
