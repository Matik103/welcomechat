
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useLogoPreview(logoUrl: string) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (logoUrl) {
      try {
        // Validate URL format
        new URL(logoUrl);
        console.log("Setting logo preview from settings:", logoUrl);
        setLogoPreview(logoUrl);
      } catch (e) {
        console.error("Invalid logo URL in settings:", logoUrl, e);
        setLogoPreview(null);
      }
    } else {
      setLogoPreview(null);
    }
  }, [logoUrl]);

  const handleLocalPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      console.log("Setting local preview before upload:", previewUrl.substring(0, 50) + "...");
      setLogoPreview(previewUrl);
    };
    reader.readAsDataURL(file);
  };

  // Upload logo to Document Storage bucket
  const uploadLogo = async (file: File, clientId: string): Promise<{ url: string, path: string } | null> => {
    try {
      // Create a unique file path with client ID to avoid collisions
      const fileName = `${clientId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      const filePath = `logos/${fileName}`;
      
      // Upload to Document Storage bucket
      const { data, error } = await supabase.storage
        .from('document_storage')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (error) {
        console.error("Error uploading logo:", error);
        throw error;
      }
      
      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('document_storage')
        .getPublicUrl(filePath);
        
      if (!urlData || !urlData.publicUrl) {
        throw new Error("Failed to get public URL for logo");
      }
      
      console.log("Logo uploaded successfully:", urlData.publicUrl);
      
      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error("Logo upload failed:", error);
      return null;
    }
  };

  return {
    logoPreview,
    setLogoPreview,
    handleLocalPreview,
    uploadLogo
  };
}
