
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface LogoUploadButtonProps {
  isUploading: boolean;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  hasExistingLogo: boolean;
}

export function LogoUploadButton({ 
  isUploading, 
  onLogoUpload, 
  hasExistingLogo 
}: LogoUploadButtonProps) {
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      onLogoUpload(event);
    }
  };

  return (
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
          {hasExistingLogo ? "Change Logo" : "Upload Logo"}
        </>
      )}
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
        aria-label="Upload logo"
      />
    </Button>
  );
}
