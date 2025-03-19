
import { useState } from "react";
import { handleLogoUploadEvent } from "@/utils/widgetSettingsUtils";
import { toast } from "sonner";

/**
 * Hook to manage logo upload functionality
 */
export function useLogoUpload(
  clientId: string | undefined, 
  settings: any, 
  setSettings: (settings: any) => void, 
  refetch: () => Promise<any>,
  isClientView: boolean = false
) {
  const [isUploading, setIsUploading] = useState(false);
  
  const logClientActivity = async (
    activity_type: string, 
    description: string, 
    metadata?: any
  ) => {
    if (clientId && isClientView) {
      try {
        const { logClientActivity } = await import("@/hooks/useClientActivity");
        return logClientActivity(clientId)(activity_type, description, metadata);
      } catch (error) {
        console.error("Error logging client activity:", error);
      }
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await handleLogoUploadEvent(
      event,
      clientId,
      (publicUrl, storagePath) => {
        const newSettings = { 
          ...settings, 
          logo_url: publicUrl,
          logo_storage_path: storagePath
        };
        setSettings(newSettings);

        if (isClientView) {
          logClientActivity(
            "logo_uploaded", 
            "uploaded a new logo for their widget", 
            { logo_url: publicUrl, logo_storage_path: storagePath }
          );
        }

        // Force refetch after a short delay to get the updated URL from the database
        setTimeout(() => {
          refetch().then(() => {
            console.log("Refetched client data after logo upload");
          });
        }, 1000);

        toast.success("Logo uploaded successfully! ✨");
      },
      (error) => {
        toast.error(error.message || "Failed to upload logo");
      },
      () => setIsUploading(true),
      () => setIsUploading(false)
    );
  };

  return {
    isUploading,
    handleLogoUpload
  };
}
