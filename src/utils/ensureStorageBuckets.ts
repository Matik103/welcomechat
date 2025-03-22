
import { supabase } from "@/integrations/supabase/client";

/**
 * Ensures that all required storage buckets exist
 * This is called when the app starts to make sure buckets are available
 */
export const ensureStorageBuckets = async (): Promise<void> => {
  try {
    console.log("Checking storage buckets...");
    
    // Get list of existing buckets
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Error listing buckets:", error.message);
      return;
    }
    
    const existingBuckets = new Set(buckets.map(bucket => bucket.name));
    const requiredBuckets = ['widget-logos', 'document_storage'];
    
    for (const bucketName of requiredBuckets) {
      if (!existingBuckets.has(bucketName)) {
        console.log(`Creating bucket: ${bucketName}`);
        
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true
        });
        
        if (createError) {
          console.error(`Error creating bucket ${bucketName}:`, createError.message);
        } else {
          console.log(`Bucket ${bucketName} created successfully`);
        }
      } else {
        console.log(`Bucket ${bucketName} already exists`);
      }
    }
    
    console.log("Storage buckets check completed");
  } catch (error) {
    console.error("Unexpected error in ensureStorageBuckets:", error);
  }
};
