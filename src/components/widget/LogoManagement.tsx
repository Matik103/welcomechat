
import { useLogoPreview } from "./logo/useLogoPreview";
import { LogoPreview } from "./logo/LogoPreview";
import { LogoUploadButton } from "./logo/LogoUploadButton";
import { LogoUrlDisplay } from "./logo/LogoUrlDisplay";

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
  const { logoPreview, handleLocalPreview } = useLogoPreview(logoUrl);

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

  // Per user's request, we'll remove the logo management UI
  return null;
}
