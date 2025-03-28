
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/client-admin';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';

// Helper function to ensure the bucket exists
const ensureBucketExists = async (bucketName: string): Promise<void> => {
  try {
    // Check if the bucket exists
    const { data: buckets, error: getBucketError } = await supabaseAdmin
      .storage
      .listBuckets();
    
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    
    if (!bucketExists) {
      // Create the bucket if it doesn't exist
      const { error: createBucketError } = await supabaseAdmin
        .storage
        .createBucket(bucketName, {
          public: true  // Make the bucket public
        });
      
      if (createBucketError) {
        console.error('Error creating bucket:', createBucketError);
        throw createBucketError;
      }
      
      // Set permission policies on the bucket for public read access
      // Note: createPolicy was deprecated, using the newer approach
      const { error: policyError } = await supabaseAdmin
        .storage
        .from(bucketName)
        .setPublic(true);
      
      if (policyError) {
        console.error('Error setting bucket policy:', policyError);
      }
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
};

export const uploadLogo = async (file: File, clientId: string): Promise<{ url: string, path: string }> => {
  try {
    const bucketName = 'client-assets';
    
    // Ensure the bucket exists
    await ensureBucketExists(bucketName);
    
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `logos/${clientId}/${uuid()}.${fileExt}`;
    
    console.log('Uploading file:', file.name, 'type:', file.type, 'size:', file.size);
    
    // Upload the file to Supabase storage
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
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from(bucketName)
      .getPublicUrl(data.path);
    
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
