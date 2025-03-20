
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LogoUploadProps {
  logoUrl: string | null | undefined;
  onLogoUpload: (file: File) => Promise<void>;
  isUploading: boolean;
}

export function LogoUpload({ logoUrl, onLogoUpload, isUploading }: LogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(logoUrl || null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo file must be less than 5MB");
        return;
      }
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please select a valid image file (JPG, PNG, GIF, SVG, WebP)");
        return;
      }
      
      // Create local preview
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Handle actual upload
      try {
        await onLogoUpload(file);
      } catch (error) {
        console.error("Logo upload failed:", error);
        // Revert preview on error
        setPreviewUrl(logoUrl || null);
        toast.error("Failed to upload logo");
      }
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="logo_upload" className="text-sm font-medium text-gray-900">
        Logo
      </Label>
      
      <div className="flex items-center gap-4">
        {previewUrl && (
          <div className="h-16 w-16 rounded overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
            <img 
              src={previewUrl} 
              alt="Client logo" 
              className="h-full w-full object-contain" 
            />
          </div>
        )}
        
        <Button 
          variant="outline" 
          className="relative"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {previewUrl ? "Change Logo" : "Upload Logo"}
            </>
          )}
          <input
            id="logo_upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
            aria-label="Upload logo"
          />
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 mt-1">
        Optional - client can upload their logo later
      </p>
    </div>
  );
}
