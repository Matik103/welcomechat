
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, XCircle } from "lucide-react";

interface LogoManagementProps {
  logoUrl: string;
  isUploading: boolean;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLogo: () => void;
}

export function LogoManagement({
  logoUrl,
  isUploading,
  onLogoUpload,
  onRemoveLogo
}: LogoManagementProps) {
  // Create a local preview state to show immediate feedback
  const [logoPreview, setLogoPreview] = useState<string>(logoUrl);

  const handleLocalPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Show preview immediately while uploading happens in background
        handleLocalPreview(file);
        // Pass the event to parent for actual upload
        onLogoUpload(event);
      } catch (error) {
        console.error("Error handling logo selection:", error);
      }
    }
  };

  // Update local preview when logoUrl changes from props
  React.useEffect(() => {
    if (logoUrl) {
      setLogoPreview(logoUrl);
    } else {
      setLogoPreview("");
    }
  }, [logoUrl]);

  return (
    <div className="space-y-4">
      <div>
        <div className="mt-1 flex items-center gap-4">
          {logoPreview && (
            <div className="relative inline-block">
              <img
                src={logoPreview}
                alt="Logo Preview"
                className="w-16 h-16 object-contain border rounded"
              />
              <Button
                type="button"
                variant="ghost"
                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                onClick={onRemoveLogo}
              >
                <XCircle className="h-5 w-5 text-gray-500 hover:text-red-500" />
              </Button>
            </div>
          )}
          
          <div>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={handleLogoSelect}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="logo-upload">
              <Button
                type="button"
                variant="outline"
                disabled={isUploading}
                className="cursor-pointer"
                onClick={() => document.getElementById("logo-upload")?.click()}
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload Logo"}
                </span>
              </Button>
            </label>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Recommended size: 64x64px. Max size: 5MB. The logo will be displayed in the chat header.
        </p>
      </div>

      {logoUrl && (
        <div className="mt-2">
          <p className="text-xs text-gray-500 truncate">
            URL: {logoUrl.substring(0, 50)}...
          </p>
        </div>
      )}
    </div>
  );
}

export default LogoManagement;

export function LogoPreview({ logoUrl, onRemoveLogo }: { logoUrl: string; onRemoveLogo: () => void }) {
  return (
    <div className="relative inline-block">
      <img
        src={logoUrl}
        alt="Logo Preview"
        className="w-16 h-16 object-contain border rounded"
      />
      <Button
        type="button"
        variant="ghost"
        className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
        onClick={onRemoveLogo}
      >
        <XCircle className="h-5 w-5 text-gray-500 hover:text-red-500" />
      </Button>
    </div>
  );
}

export function LogoUploadButton({ isUploading, onLogoUpload, hasExistingLogo }: { 
  isUploading: boolean; 
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hasExistingLogo: boolean;
}) {
  return (
    <div>
      <input
        id="logo-upload"
        type="file"
        accept="image/*"
        onChange={onLogoUpload}
        className="hidden"
        disabled={isUploading}
      />
      <label htmlFor="logo-upload">
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          className="cursor-pointer"
          onClick={() => document.getElementById("logo-upload")?.click()}
          asChild
        >
          <span>
            <Upload className="mr-2 h-4 w-4" />
            {isUploading ? "Uploading..." : hasExistingLogo ? "Change Logo" : "Upload Logo"}
          </span>
        </Button>
      </label>
    </div>
  );
}

export function LogoUrlDisplay({ logoUrl }: { logoUrl: string }) {
  if (!logoUrl) return null;
  
  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500 truncate">
        URL: {logoUrl.length > 50 ? `${logoUrl.substring(0, 50)}...` : logoUrl}
      </p>
    </div>
  );
}

export function useLogoPreview(initialLogoUrl: string) {
  const [logoPreview, setLogoPreview] = useState<string>(initialLogoUrl);

  const handleLocalPreview = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setLogoPreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Update local preview when initialLogoUrl changes
  React.useEffect(() => {
    if (initialLogoUrl) {
      setLogoPreview(initialLogoUrl);
    } else {
      setLogoPreview("");
    }
  }, [initialLogoUrl]);

  return { logoPreview, handleLocalPreview };
}
