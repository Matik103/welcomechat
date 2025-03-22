
import { useState, useEffect } from "react";

// Simple URL validation function
const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Allow data URLs for local previews
  if (url.startsWith('data:')) return true;
  
  // Allow blob URLs for local previews
  if (url.startsWith('blob:')) return true;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

export function useLogoPreview(logoUrl: string) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (logoUrl) {
      if (isValidUrl(logoUrl)) {
        console.log("useLogoPreview: Setting logo preview from URL:", logoUrl.substring(0, 50) + "...");
        setLogoPreview(logoUrl);
      } else {
        console.warn("useLogoPreview: Invalid logo URL format:", logoUrl);
        setLogoPreview(null);
      }
    } else {
      console.log("useLogoPreview: No logo URL provided, clearing preview");
      setLogoPreview(null);
    }
  }, [logoUrl]);

  const handleLocalPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      console.log("useLogoPreview: Setting local preview before upload");
      setLogoPreview(previewUrl);
    };
    reader.readAsDataURL(file);
  };

  return {
    logoPreview,
    setLogoPreview,
    handleLocalPreview
  };
}
