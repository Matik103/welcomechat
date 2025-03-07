
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
      handleLocalPreview(file);
      onLogoUpload(event);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="mt-1 flex items-center gap-4">
          {logoPreview && <LogoPreview logoUrl={logoPreview} onRemoveLogo={onRemoveLogo} />}
          <LogoUploadButton 
            isUploading={isUploading} 
            onLogoUpload={handleLogoSelect} 
            hasExistingLogo={!!logoPreview} 
          />
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Recommended size: 64x64px. Max size: 5MB. The logo will be displayed in the chat header.
        </p>
      </div>

      <LogoUrlDisplay logoUrl={logoUrl} />
    </div>
  );
}
