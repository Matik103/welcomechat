
/**
 * Constants for Supabase storage buckets
 */

// Document storage bucket name
export const DOCUMENTS_BUCKET = 'document-storage';

/**
 * Ensures that the document storage bucket exists
 * Creates it if it doesn't exist
 */
export const ensureDocumentStorageBucket = async (): Promise<boolean> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === DOCUMENTS_BUCKET);
    
    if (!bucketExists) {
      console.log(`Creating ${DOCUMENTS_BUCKET} bucket...`);
      const { data, error } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/json',
          'application/msword',
          'text/xml',
          'application/xml'
        ]
      });
      
      if (error) {
        console.error(`Error creating ${DOCUMENTS_BUCKET} bucket:`, error);
        return false;
      }
      
      console.log(`Created ${DOCUMENTS_BUCKET} bucket successfully`);
      
      // Set up public policy for the bucket
      const { error: policyError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .createSignedUrl('bucket-policy-dummy.txt', 3600);
      
      if (policyError && !policyError.message.includes('Object not found')) {
        console.error('Error checking bucket policy:', policyError);
      }
      
      return true;
    }
    
    console.log(`${DOCUMENTS_BUCKET} bucket already exists`);
    return true;
  } catch (error) {
    console.error(`Error ensuring ${DOCUMENTS_BUCKET} bucket exists:`, error);
    return false;
  }
};
