
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
