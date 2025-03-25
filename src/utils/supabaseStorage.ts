
import { supabase } from "@/integrations/supabase/client";

// Define the document bucket name constant
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
 * Creates a folder path for a user's document
 * @param userId The user's ID
 * @param fileName The file name
 * @returns The folder path for the user's document
 */
export const createUserDocumentPath = (userId: string, fileName: string): string => {
  if (!userId) {
    throw new Error('User ID is required for creating document paths');
  }
  
  return `${userId}/${fileName}`;
};
