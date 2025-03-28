
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/client-admin';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';

// Helper function to ensure the bucket exists
const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    console.log('Starting to check if bucket exists:', bucketName);
    
    // Check if admin client is configured
    if (!isAdminClientConfigured()) {
      console.error('Supabase admin client not properly configured. Service role key is missing.');
      toast.error('Server configuration error: Missing service role key');
      return false;
    }
    
    // Check if the bucket exists
    const { data: buckets, error: getBucketError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    if (getBucketError) {
      console.error('Error listing buckets:', getBucketError);
      
      // If we get an invalid signature error, it means the service role key is invalid
      if (getBucketError.message.includes('invalid signature')) {
        toast.error('Authentication error: Invalid Supabase service role key');
        return false;
      }
      
      toast.error(`Failed to list buckets: ${getBucketError.message}`);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    console.log('Bucket exists?', bucketExists);
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      console.log('Creating bucket:', bucketName);
      const { error: createBucketError } = await supabaseAdmin
        .storage
        .createBucket(bucketName, {
          public: true  // Make the bucket public
        });
      
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        toast.error(`Failed to create bucket: ${createBucketError.message}`);
        return false;
      }
      
      // Set bucket policy to public
      const { error: policyError } = await supabaseAdmin
        .storage
        .from(bucketName)
        .createSignedUrl('dummy.txt', 60); // This is just to test if we have access
      
      if (policyError && !policyError.message.includes('not found')) {
        console.error('Error checking bucket policy:', policyError);
      }
      
      console.log('Bucket created successfully with public access:', bucketName);
      return true;
    } else {
      console.log('Bucket already exists:', bucketName);
      return true;
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    toast.error(`Bucket configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

export const uploadLogo = async (file: File, clientId: string): Promise<{ url: string, path: string }> => {
  try {
    const bucketName = 'bot-logos';
    
    console.log('Ensuring bucket exists:', bucketName);
    // Ensure the bucket exists before uploading
    const bucketReady = await ensureBucketExists(bucketName);
    
    if (!bucketReady) {
      throw new Error('Logo storage is not configured properly. Please check server configuration.');
    }
    
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `${clientId}/${uuid()}.${fileExt}`;
    
    console.log('Uploading file:', file.name, 'type:', file.type, 'size:', file.size);
    
    // Upload the file to Supabase storage
    // Try using the regular client first, only for the upload operation
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type // Explicitly set the content type
      });
    
    if (error) {
      console.error('Error uploading logo:', error);
      
      // If permission denied, try with admin client
      if (error.message.includes('Permission denied')) {
        console.log('Retrying upload with admin client...');
        const adminUploadResult = await supabaseAdmin
          .storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type
          });
        
        if (adminUploadResult.error) {
          console.error('Admin upload also failed:', adminUploadResult.error);
          toast.error(`Upload failed: ${adminUploadResult.error.message}`);
          throw adminUploadResult.error;
        }
        
        data = adminUploadResult.data;
      } else {
        toast.error(`Upload failed: ${error.message}`);
        throw error;
      }
    }
    
    if (!data || !data.path) {
      throw new Error('Upload completed but no file path was returned');
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to generate public URL for uploaded file');
    }
    
    console.log('Upload successful, public URL:', publicUrlData.publicUrl);
    
    return {
      url: publicUrlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Error in uploadLogo:', error);
    toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw error;
  }
};

export const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, clientId: string): Promise<{ url: string, path: string } | null> => {
  const file = event.target.files?.[0];
  
  if (!file) {
    return null;
  }
  
  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    toast.error('Please upload a valid image file (JPEG, PNG, GIF, SVG, or WebP)');
    return null;
  }
  
  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    toast.error('File size should be less than 5MB');
    return null;
  }
  
  try {
    return await uploadLogo(file, clientId);
  } catch (error) {
    console.error('Logo upload failed:', error);
    return null;
  }
};
