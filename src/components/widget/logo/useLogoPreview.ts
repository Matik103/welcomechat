
import { useState, useEffect } from "react";

export function useLogoPreview(logoUrl: string) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  useEffect(() => {
    if (logoUrl) {
      console.log("Setting logo preview from settings:", logoUrl);
      setLogoPreview(logoUrl);
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

  return {
    logoPreview,
    setLogoPreview,
    handleLocalPreview
  };
}
