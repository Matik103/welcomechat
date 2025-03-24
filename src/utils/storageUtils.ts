
import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if a storage bucket exists
 * @param bucketName The name of the bucket to check
 * @returns Promise resolving to boolean indicating if bucket exists
 */
export const checkBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.getBucket(bucketName);
    if (error) {
      console.error(`Error checking if bucket ${bucketName} exists:`, error);
      return false;
    }
    return !!data;
  } catch (error) {
    console.error(`Error checking bucket ${bucketName}:`, error);
    return false;
  }
};

/**
 * Verifies required storage buckets exist
 * @returns Object with existence status of required buckets
 */
export const verifyStorageBuckets = async (): Promise<Record<string, boolean>> => {
  const results: Record<string, boolean> = {};
  
  // Check for required buckets
  results['Document Storage'] = await checkBucketExists('Document Storage');
  results['Client Documents'] = await checkBucketExists('client_documents');
  
  return results;
};
