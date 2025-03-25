
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { v4 as uuid } from 'uuid';

export const uploadLogo = async (file: File, clientId: string): Promise<{ url: string, path: string }> => {
  try {
    // Generate a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `logos/${clientId}/${uuid()}.${fileExt}`;
    
    // Upload the file to Supabase storage
    const { data, error } = await supabase
      .storage
      .from('client-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading logo:', error);
      toast.error(`Upload failed: ${error.message}`);
      throw error;
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase
      .storage
      .from('client-assets')
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
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    toast.error('Please upload a valid image file (JPEG, PNG, GIF, or SVG)');
    return null;
  }
  
  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error('File size should be less than 2MB');
    return null;
  }
  
  try {
    return await uploadLogo(file, clientId);
  } catch (error) {
    console.error('Logo upload failed:', error);
    return null;
  }
};
