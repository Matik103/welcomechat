
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/client-admin';
import { toast } from 'sonner';

// Storage bucket names
export const DOCUMENTS_BUCKET = 'client_documents';
export const BOT_LOGOS_BUCKET = 'bot-logos';

/**
 * Checks if a bucket exists and creates it if it doesn't
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    console.log(`Checking if bucket ${bucketName} exists...`);
    
    // First, try to list the buckets to see if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      // Try to refresh the connection before failing
      try {
        // Attempt to force refresh the Supabase client
        const { data: refreshData } = await supabase.auth.refreshSession();
        console.log('Refreshed Supabase connection', refreshData ? 'successfully' : 'with no data');
        
        // Try listing buckets again after refresh
        const { data: refreshedBuckets, error: refreshListError } = await supabase.storage.listBuckets();
        
        if (refreshListError) {
          console.error('Error listing buckets after refresh:', refreshListError);
          return false;
        }
        
        buckets = refreshedBuckets;
      } catch (refreshErr) {
        console.error('Failed to refresh connection:', refreshErr);
        return false;
      }
    }
    
    // Check if our bucket exists
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (bucketExists) {
      console.log(`Bucket ${bucketName} already exists`);
      return true;
    }
    
    console.log(`Bucket ${bucketName} not found, creating...`);
    
    // Try to create using admin client first
    if (supabaseAdmin) {
      try {
        const { error } = await supabaseAdmin.storage.createBucket(bucketName, {
          public: bucketName === BOT_LOGOS_BUCKET, // Bot logos are public, documents are not
          fileSizeLimit: bucketName === DOCUMENTS_BUCKET ? 20971520 : 5242880 // 20MB for docs, 5MB for logos
        });
        
        if (error) {
          console.error(`Error creating bucket with admin client: ${error.message}`);
          throw error;
        }
        
        console.log(`Bucket ${bucketName} created successfully with admin client`);
        return true;
      } catch (adminError) {
        console.error('Failed to create bucket with admin client, falling back to RPC:', adminError);
      }
    }
    
    // Fallback: Try to create using a Supabase function (RPC) that has been set up for this purpose
    try {
      const { data, error } = await supabase.rpc('create_storage_bucket', { 
        bucket_id: bucketName,
        is_public: bucketName === BOT_LOGOS_BUCKET
      });
      
      if (error) {
        console.error(`Error creating bucket with RPC: ${error.message}`);
        throw error;
      }
      
      console.log(`Bucket ${bucketName} created successfully with RPC`);
      return true;
    } catch (rpcError) {
      console.error('Failed to create bucket with RPC:', rpcError);
      
      // As a last resort, try regular client (might work if user has proper permissions)
      try {
        const { error } = await supabase.storage.createBucket(bucketName, {
          public: bucketName === BOT_LOGOS_BUCKET
        });
        
        if (error) {
          console.error(`Error creating bucket with regular client: ${error.message}`);
          throw error;
        }
        
        console.log(`Bucket ${bucketName} created successfully with regular client`);
        return true;
      } catch (clientError) {
        console.error('Failed to create bucket with regular client:', clientError);
        throw clientError;
      }
    }
  } catch (error) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, error);
    return false;
  }
};

/**
 * Ensures that all required storage buckets exist
 */
export const ensureAllBucketsExist = async (): Promise<boolean> => {
  try {
    // Try to reconnect to Supabase first
    try {
      await supabase.auth.refreshSession();
      console.log('Refreshed Supabase connection before checking buckets');
    } catch (refreshErr) {
      console.warn('Could not refresh session, continuing anyway:', refreshErr);
    }
    
    const documentsResult = await ensureBucketExists(DOCUMENTS_BUCKET);
    const logosResult = await ensureBucketExists(BOT_LOGOS_BUCKET);
    
    return documentsResult && logosResult;
  } catch (error) {
    console.error('Error ensuring all buckets exist:', error);
    return false;
  }
};

/**
 * Utility to fix missing buckets when an upload error occurs
 */
export const handleBucketNotFoundError = async (bucketName: string): Promise<boolean> => {
  try {
    toast.info(`Attempting to fix missing storage bucket: ${bucketName}`);
    
    // Try to reconnect to Supabase first
    try {
      await supabase.auth.refreshSession();
      console.log('Refreshed Supabase connection before fixing bucket');
    } catch (refreshErr) {
      console.warn('Could not refresh session, continuing anyway:', refreshErr);
    }
    
    const result = await ensureBucketExists(bucketName);
    
    if (result) {
      toast.success(`Storage bucket ${bucketName} has been created`);
      return true;
    } else {
      toast.error(`Failed to create storage bucket ${bucketName}`);
      return false;
    }
  } catch (error) {
    toast.error(`Error fixing storage bucket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};
