
import { useState } from "react";
import { useClientMutation } from "./useClientMutation";
import { toast } from "sonner";
import { ExtendedActivityType } from "@/types/activity";
import { useLogoPreview } from "@/components/widget/logo/useLogoPreview";

export const useClientFormSubmission = (
  clientId: string | undefined,
  isClientView: boolean,
  logClientActivity: (
    activity_type: ExtendedActivityType,
    description: string,
    metadata?: any
  ) => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const clientMutation = useClientMutation(clientId);
  const { uploadLogo } = useLogoPreview("");

  const handleSubmit = async (data: any) => {
    try {
      setIsLoading(true);

      // Handle logo upload if there's a temporary file
      if (data._tempLogoFile && clientId) {
        try {
          const uploadResult = await uploadLogo(data._tempLogoFile, clientId);
          if (uploadResult) {
            data.logo_url = uploadResult.url;
            data.logo_storage_path = uploadResult.path;
            
            // Log logo uploaded activity
            await logClientActivity(
              "logo_uploaded" as ExtendedActivityType,
              "Logo uploaded for client",
              {
                logo_url: data.logo_url,
                logo_path: data.logo_storage_path
              }
            );
          }
        } catch (error) {
          console.error("Error uploading logo:", error);
          toast.error("Failed to upload logo");
        }
      }

      // Remove the temporary file from the data
      delete data._tempLogoFile;

      // Process the data for widget settings
      const formattedData = {
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name,
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path,
        widget_settings: {
          agent_name: data.agent_name,
          agent_description: data.agent_description,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path
        }
      };

      // Submit the data
      await clientMutation.mutateAsync(formattedData);

      // Log activity
      await logClientActivity(
        "client_updated",
        isClientView
          ? "Updated client information from client portal"
          : "Updated client information from admin panel",
        {
          client_name: data.client_name,
          email: data.email,
          agent_name: data.agent_name
        }
      );

      toast.success("Client information updated successfully");
    } catch (error) {
      console.error("Error submitting client form:", error);
      toast.error("Error updating client information. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubmit,
    isLoading,
    clientMutation
  };
};
