
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures a Supabase storage file has a public URL
 * @param bucket The name of the storage bucket
 * @param filePath The file path within the bucket
 * @returns The public URL of the file
 */
export const ensurePublicUrl = (bucket: string, filePath: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  
  if (!data || !data.publicUrl) {
    console.error("Failed to generate public URL for", bucket, filePath);
    throw new Error("Failed to generate public URL");
  }
  
  return data.publicUrl;
};
