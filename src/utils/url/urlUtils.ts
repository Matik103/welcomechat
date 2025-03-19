
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
