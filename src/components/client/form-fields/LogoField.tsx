
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { LogoManagement } from "@/components/widget/LogoManagement";
import { toast } from "sonner";

interface LogoFieldProps {
  form: UseFormReturn<any>;
  onLogoFileChange: (file: File | null) => void;
}

export const LogoField = ({ form, onLogoFileChange }: LogoFieldProps) => {
  const { watch, setValue } = form;
  const [isUploading, setIsUploading] = useState(false);
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null);
  
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
    
    onLogoFileChange(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setLocalLogoPreview(previewUrl);
    };
    reader.readAsDataURL(file);
    
    toast.success("Logo selected. It will be uploaded when you save the client.");
  };
  
  const handleRemoveLogo = () => {
    setValue("logo_url", "");
    setValue("logo_storage_path", "");
    onLogoFileChange(null);
    setLocalLogoPreview(null);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-900">
        AI Agent Logo
      </Label>
      <LogoManagement
        logoUrl={localLogoPreview || watch("logo_url") || ""}
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
