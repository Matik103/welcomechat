// Define bucket names as constants
export const DOCUMENTS_BUCKET = 'document-storage';

/**
 * Gets the document storage bucket for uploads
 */
export const getDocumentStorageBucket = async () => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Get the bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error(`Failed to access storage: ${listError.message}`);
    }
    
    const documentBucket = buckets?.find(b => b.name === DOCUMENTS_BUCKET);
    if (!documentBucket) {
      throw new Error(`Storage bucket ${DOCUMENTS_BUCKET} not found`);
    }
    
    console.log(`Bucket ${DOCUMENTS_BUCKET} ready for upload`);
    return documentBucket;
  } catch (error) {
    console.error('Error accessing document storage bucket:', error);
    throw error;
  }
};

/**
 * Uploads a file to the document storage bucket
 */
export const uploadToDocumentStorage = async (
  file: File,
  clientId: string
): Promise<{ path: string; url: string }> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Ensure we can access the bucket
    await getDocumentStorageBucket();
    
    // Generate a unique file path
    const uniqueId = crypto.randomUUID();
    const filePath = `${clientId}/${uniqueId}-${file.name}`;
    
    // Upload the file
    const { data, error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET)
      .getPublicUrl(filePath);
      
    return {
      path: filePath,
      url: publicUrl
    };
  } catch (error) {
    console.error('Error in uploadToDocumentStorage:', error);
    throw error;
  }
};
