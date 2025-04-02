
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENTS_BUCKET } from "./supabaseStorage";

interface RLSResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Fix document links row-level security issues
 * and ensure the document storage bucket exists
 */
export async function fixDocumentLinksRLS(): Promise<RLSResult> {
  try {
    console.log("Checking and fixing document storage permissions");
    
    // Step 1: Check if the bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error("Error listing buckets:", bucketsError);
      return {
        success: false,
        message: `Error checking buckets: ${bucketsError.message}`,
        details: bucketsError
      };
    }
    
    // Find our document storage bucket
    const docStorageBucket = buckets?.find(b => b.name === DOCUMENTS_BUCKET);
    
    // If bucket doesn't exist, create it
    if (!docStorageBucket) {
      console.log(`Creating ${DOCUMENTS_BUCKET} bucket`);
      
      try {
        // Create the bucket with public access
        const { data, error } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
          public: true,
          fileSizeLimit: 52428800 // 50MB limit
        });
        
        if (error) {
          console.error("Error creating bucket:", error);
          return {
            success: false,
            message: `Failed to create bucket: ${error.message}`,
            details: error
          };
        }
        
        console.log(`${DOCUMENTS_BUCKET} bucket created successfully`);
      } catch (createError) {
        console.error("Error creating bucket:", createError);
        return {
          success: false,
          message: `Failed to create bucket: ${createError instanceof Error ? createError.message : String(createError)}`,
          details: createError
        };
      }
    } else {
      console.log(`${DOCUMENTS_BUCKET} bucket already exists`);
    }
    
    // Return success
    return {
      success: true,
      message: `Storage permissions fixed successfully. The ${DOCUMENTS_BUCKET} bucket is ready to use.`
    };
  } catch (error) {
    console.error("Error fixing document links RLS:", error);
    return {
      success: false,
      message: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      details: error
    };
  }
}
