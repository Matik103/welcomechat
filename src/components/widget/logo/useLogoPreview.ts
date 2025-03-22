
import { useState, useEffect } from "react";

export function useLogoPreview(logoUrl: string) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (logoUrl) {
      try {
        // Check if it's a valid URL format
        new URL(logoUrl);
        console.log("Setting logo preview from URL:", logoUrl);
        setLogoPreview(logoUrl);
      } catch (e) {
        console.error("Invalid logo URL format:", logoUrl, e);
        setLogoPreview(null);
      }
    } else {
      console.log("No logo URL provided, setting preview to null");
      setLogoPreview(null);
    }
  }, [logoUrl]);

  const handleLocalPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      console.log("Generated local preview for file:", file.name);
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
