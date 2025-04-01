
import { supabaseAdmin, isAdminClientConfigured } from '@/integrations/supabase/client-admin';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Uploads a logo file to the bot-logos bucket
 * @param file The file to upload
 * @param clientId The client ID to associate with the logo
 * @returns Object containing the URL and storage path of the uploaded logo
 */
export const uploadLogo = async (
  file: File,
  clientId: string
): Promise<{ url: string; path: string }> => {
  try {
    console.log('Attempting to upload logo for client:', clientId);
    
    // Check if admin client is configured (needed for storage uploads)
    if (!isAdminClientConfigured()) {
      console.error('Admin client not configured - cannot upload logo');
      throw new Error('Server configuration error: Unable to upload files at this time');
    }
    
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `${clientId}/${fileName}`;
    
    console.log('Uploading file to path:', filePath);
    
    // Use supabaseAdmin for uploading to storage
    if (!supabaseAdmin) {
      throw new Error('Admin client not configured properly');
    }
    
    const { data, error } = await supabaseAdmin.storage
      .from('bot-logos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
      
    if (error) {
      console.error('Error uploading logo:', error);
      throw error;
    }
    
    console.log('Upload successful:', data);
    
    // Get the public URL of the uploaded file
    if (!supabaseAdmin) {
      throw new Error('Admin client not configured properly');
    }
    
    const { data: urlData } = supabaseAdmin.storage
      .from('bot-logos')
      .getPublicUrl(filePath);
      
    console.log('Public URL generated:', urlData);
    
    return {
      url: urlData.publicUrl,
      path: filePath
    };
  } catch (error) {
    console.error('Exception in uploadLogo:', error);
    
    // More detailed error handling
    if (error instanceof Error) {
      // If it's related to admin configuration, provide a clear message
      if (error.message.includes('admin client not configured')) {
        toast.error('Server configuration error: Unable to upload files');
      } else if (error.message.includes('storage/object_too_large')) {
        toast.error('File is too large. Maximum size is 10MB');
      } else {
        toast.error(`Upload failed: ${error.message}`);
      }
    }
    
    throw error;
  }
};

/**
 * Handles logo upload from an input element change event
 * @param event The change event from the file input element
 * @param clientId The client ID to associate with the logo
 * @returns Object containing the URL and storage path of the uploaded logo, or null if upload failed
 */
export const handleLogoUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  clientId: string
): Promise<{ url: string; path: string } | null> => {
  const file = event.target.files?.[0];
  if (!file) {
    console.log('No file selected for upload');
    return null;
  }
  
  try {
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo file must be less than 5MB');
      return null;
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPG, PNG, GIF, SVG, WebP)');
      return null;
    }
    
    // Upload the logo
    const result = await uploadLogo(file, clientId);
    toast.success('Logo uploaded successfully');
    return result;
  } catch (error) {
    console.error('Error in handleLogoUpload:', error);
    // Error is already handled and displayed in uploadLogo function
    return null;
  }
};

// Initialize the bot-logos bucket
export const initializeBotLogosBucket = async (): Promise<boolean> => {
  try {
    if (!isAdminClientConfigured()) {
      console.error('Cannot initialize bucket: Supabase admin client not configured');
      return false;
    }

    if (!supabaseAdmin) {
      console.error('Supabase admin client is null');
      return false;
    }

    // Create the bucket if it doesn't exist
    const { error } = await supabaseAdmin.storage.createBucket('bot-logos', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
    });

    if (error && !error.message.includes('already exists')) {
      console.error('Error creating bot-logos bucket:', error);
      return false;
    }

    console.log('bot-logos bucket initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing bot-logos bucket:', error);
    return false;
  }
};
