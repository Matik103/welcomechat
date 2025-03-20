
import { Json as SupabaseJson } from "@/integrations/supabase/types";

/**
 * Extended Json type that can be used in place of Supabase's Json type
 * This helps with type checking when working with Json fields
 */
export type Json = SupabaseJson;

/**
 * Helper type for working with Json objects
 */
export type JsonObject = Record<string, any>;

/**
 * Convert a JsonObject to a Json type for Supabase
 */
export const toJson = (obj: JsonObject): Json => {
  return obj as Json;
};
