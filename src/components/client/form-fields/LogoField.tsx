
import { UseFormReturn } from "react-hook-form";
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { LogoManagement } from "@/components/widget/LogoManagement";
import { toast } from "sonner";
import { useLogoPreview } from "@/components/widget/logo/useLogoPreview";

interface LogoFieldProps {
  form: UseFormReturn<any>;
  onLogoFileChange: (file: File | null) => void;
  clientId?: string;
}

export const LogoField = ({ form, onLogoFileChange, clientId = '' }: LogoFieldProps) => {
  const { watch, setValue } = form;
  const [isUploading, setIsUploading] = useState(false);
  const { logoPreview, handleLocalPreview, uploadLogo } = useLogoPreview(watch("logo_url") || "");
  
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
    
    onLogoFileChange(file);
    handleLocalPreview(file);
    
    // If we have a client ID, upload the logo immediately
    if (clientId) {
      setIsUploading(true);
      
      try {
        const result = await uploadLogo(file, clientId);
        
        if (result) {
          setValue("logo_url", result.url);
          setValue("logo_storage_path", result.path);
          toast.success("Logo uploaded successfully");
        } else {
          toast.error("Failed to upload logo");
        }
      } catch (error) {
        console.error("Error uploading logo:", error);
        toast.error("Error uploading logo");
      } finally {
        setIsUploading(false);
      }
    } else {
      // If no client ID, we'll upload when the form is submitted
      toast.success("Logo selected. It will be uploaded when you save the client.");
    }
  };
  
  const handleRemoveLogo = () => {
    setValue("logo_url", "");
    setValue("logo_storage_path", "");
    onLogoFileChange(null);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-900">
        AI Agent Logo
      </Label>
      <LogoManagement
        logoUrl={logoPreview || watch("logo_url") || ""}
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
