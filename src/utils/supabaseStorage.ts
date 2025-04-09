// Define bucket names as constants
export const DOCUMENTS_BUCKET = 'Client Documents';
export const DOCUMENTS_BUCKET_ID = 'client_documents';

/**
 * Sets up storage policies for the document bucket
 */
export const setupStoragePolicies = async () => {
  try {
    const { supabaseAdmin } = await import('@/integrations/supabase/client-admin');
    
    // Call the RPC function to set up policies
    const { error } = await supabaseAdmin.rpc('setup_document_storage_policies');
    
    if (error) {
      console.error('Error setting up storage policies:', error);
      throw error;
    }
    
    console.log('Storage policies set up successfully');
    return true;
  } catch (error) {
    console.error('Error in setupStoragePolicies:', error);
    throw error;
  }
};

/**
 * Gets the document storage bucket for uploads
 */
export const getDocumentStorageBucket = async () => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { supabaseAdmin } = await import('@/integrations/supabase/client-admin');
    
    // Get the bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      throw new Error(`Failed to access storage: ${listError.message}`);
    }
    
    // Try to find the bucket by name or ID
    const documentBucket = buckets?.find(b => 
      b.name === DOCUMENTS_BUCKET || 
      b.id === DOCUMENTS_BUCKET_ID
    );

    if (!documentBucket) {
      console.log(`Storage bucket ${DOCUMENTS_BUCKET} not found, creating...`);
      
      // Create the bucket using admin client
      const { error: createError } = await supabaseAdmin.storage.createBucket(DOCUMENTS_BUCKET_ID, {
        public: false,
        allowedMimeTypes: [
          'application/pdf',
          'text/plain',
          'application/vnd.google-apps.document',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        fileSizeLimit: 1024 * 1024 * 20 // 20MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        throw new Error(`Failed to create storage bucket: ${createError.message}`);
      }
      
      // Set up storage policies
      await setupStoragePolicies();
      
      console.log(`Bucket ${DOCUMENTS_BUCKET} created and configured successfully`);
      return { name: DOCUMENTS_BUCKET, id: DOCUMENTS_BUCKET_ID };
    }
    
    console.log(`Bucket ${documentBucket.name} ready for upload`);
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
    const bucket = await getDocumentStorageBucket();
    
    // Generate a unique file path
    const uniqueId = crypto.randomUUID();
    const filePath = `${clientId}/${uniqueId}-${file.name}`;
    
    console.log(`Uploading file to bucket: ${bucket.name}, path: ${filePath}`);
    
    // Upload the file using the bucket ID
    const { data, error: uploadError } = await supabase.storage
      .from(DOCUMENTS_BUCKET_ID)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }
    
    // Get the public URL using the bucket ID
    const { data: { publicUrl } } = supabase.storage
      .from(DOCUMENTS_BUCKET_ID)
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
