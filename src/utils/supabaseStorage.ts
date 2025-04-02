
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin, isAdminClientConfigured } from "@/integrations/supabase/client-admin";

// Define the document bucket name constant - ensure consistency across the app
export const DOCUMENTS_BUCKET = 'document-storage';

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

/**
 * Validates if a URL is properly formatted
 * @param url The URL to validate
 * @returns True if the URL is valid, otherwise false
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * Extracts components from a Supabase storage URL
 * @param url The Supabase storage URL
 * @returns An object containing the bucket, path, and filename
 */
export const parseStorageUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    
    // Remove /storage/v1/object/public/ from the path
    const cleanPath = path.replace(/^\/storage\/v1\/object\/public\//, '');
    
    // Split the remaining path into bucket and filepath
    const parts = cleanPath.split('/');
    const bucket = parts[0];
    const filepath = parts.slice(1).join('/');
    
    // Get the filename
    const filename = parts[parts.length - 1];
    
    return {
      bucket,
      path: filepath,
      filename
    };
  } catch (e) {
    console.error("Error parsing storage URL:", e);
    return {
      bucket: null,
      path: null,
      filename: null
    };
  }
};

/**
 * Creates the document-storage bucket if it doesn't exist
 */
export const ensureDocumentStorageBucket = async (): Promise<boolean> => {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error listing buckets:", listError);
      return false;
    }
    
    // Check if the document-storage bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET);
    
    if (!bucketExists) {
      console.log(`Creating ${DOCUMENTS_BUCKET} bucket...`);
      
      // First try with admin client if available
      if (isAdminClientConfigured()) {
        try {
          const { error: createError } = await supabaseAdmin.storage.createBucket(DOCUMENTS_BUCKET, {
            public: true,
            fileSizeLimit: 20971520, // 20MB
            allowedMimeTypes: [
              'application/pdf',
              'application/msword',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'text/plain',
              'application/vnd.ms-excel',
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
              'application/vnd.ms-powerpoint',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'text/csv'
            ]
          });
          
          if (createError && !createError.message.includes('already exists')) {
            console.error(`Error creating ${DOCUMENTS_BUCKET} bucket with admin client:`, createError);
            // Fall back to regular client
          } else {
            console.log(`Created ${DOCUMENTS_BUCKET} bucket with admin client`);
            return true;
          }
        } catch (adminError) {
          console.error(`Error creating ${DOCUMENTS_BUCKET} bucket with admin client:`, adminError);
          // Fall back to regular client
        }
      }
      
      // Try with regular client if admin failed or isn't available
      try {
        const { error: createError } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
          public: true,
          fileSizeLimit: 20971520, // 20MB
          allowedMimeTypes: [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/csv'
          ]
        });
        
        if (createError && !createError.message.includes('already exists')) {
          console.error(`Error creating ${DOCUMENTS_BUCKET} bucket with regular client:`, createError);
          return false;
        }
        
        console.log(`Created ${DOCUMENTS_BUCKET} bucket with regular client`);
        return true;
      } catch (error) {
        console.error(`Error creating ${DOCUMENTS_BUCKET} bucket:`, error);
        return false;
      }
    }
    
    console.log(`${DOCUMENTS_BUCKET} bucket already exists`);
    return true;
  } catch (error) {
    console.error(`Error ensuring ${DOCUMENTS_BUCKET} bucket:`, error);
    return false;
  }
};
