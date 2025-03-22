
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { LogoManagement } from "@/components/widget/LogoManagement";
import { toast } from "sonner";

interface LogoFieldProps {
  control: any;
  onLogoChange: (file: File | null) => void;
  logoPreviewUrl: string | null;
}

export const LogoField = ({ control, onLogoChange, logoPreviewUrl }: LogoFieldProps) => {
  const [isUploading, setIsUploading] = useState(false);
  
  useEffect(() => {
    if (logoPreviewUrl) {
      console.log("LogoField: Displaying logo from URL:", logoPreviewUrl);
    }
  }, [logoPreviewUrl]);
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file must be less than 5MB");
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, GIF, SVG, WebP)");
      return;
    }
    
    console.log("LogoField: Logo file selected:", file.name, file.type);
    setIsUploading(true);
    onLogoChange(file);
    setIsUploading(false);
    toast.success("Logo selected. It will be uploaded when you save the client.");
  };
  
  const handleRemoveLogo = () => {
    console.log("LogoField: Removing logo");
    onLogoChange(null);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-900">
        AI Agent Logo
      </Label>
      <LogoManagement
        logoUrl={logoPreviewUrl || ""}
        isUploading={isUploading}
        onLogoUpload={handleLogoUpload}
        onRemoveLogo={handleRemoveLogo}
      />
      <p className="text-xs text-gray-500 mt-1">
        The logo will appear in the chat header for your AI assistant
      </p>
    </div>
  );
};
