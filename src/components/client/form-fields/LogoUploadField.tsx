
import { UseFormReturn } from "react-hook-form";
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, XCircle } from "lucide-react";

interface LogoUploadFieldProps {
  form: UseFormReturn<any>;
}

export const LogoUploadField = ({ form }: LogoUploadFieldProps) => {
  const { setValue, watch } = form;
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    watch("logo_url") || null
  );
  
  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setValue("_tempLogoFile", file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewUrl = e.target?.result as string;
      setPreviewUrl(previewUrl);
    };
    reader.readAsDataURL(file);
  };
  
  const handleRemoveLogo = () => {
    setValue("logo_url", "");
    setValue("_tempLogoFile", null);
    setPreviewUrl(null);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="logo" className="text-sm font-medium text-gray-900">
        Logo
      </Label>
      
      <div className="mt-1 flex items-center space-x-4">
        {previewUrl ? (
          <div className="relative">
            <img 
              src={previewUrl} 
              alt="Logo preview" 
              className="h-16 w-16 object-contain border rounded"
            />
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="absolute -top-2 -right-2 text-gray-500 hover:text-red-500"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div className="h-16 w-16 border border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50">
            <Upload className="h-6 w-6 text-gray-400" />
          </div>
        )}
        
        <div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => document.getElementById('logo-upload')?.click()}
          >
            {previewUrl ? 'Change Logo' : 'Upload Logo'}
          </Button>
          <input 
            id="logo-upload"
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            className="hidden"
          />
          <p className="text-xs text-gray-500 mt-1">JPG, PNG or SVG, Max 5MB</p>
        </div>
      </div>
    </div>
  );
};
