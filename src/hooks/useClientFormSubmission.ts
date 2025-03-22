
import { useState } from "react";
import { updateClient } from "@/services/clientService";
import { ExtendedActivityType } from "@/types/activity";
import { ClientFormData } from "@/types/client";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useClientFormSubmission = (
  clientId?: string,
  isClientView = false,
  logClientActivity?: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: ClientFormData): Promise<void> => {
    if (!clientId) {
      toast.error("Client ID is required to update client information");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Submitting form with data:", data);
      
      // Handle logo upload if needed
      if (data._tempLogoFile) {
        const file = data._tempLogoFile;
        console.log(`Uploading logo file: ${file.name} (${file.size} bytes)`);
        
        // Create a filename with a prefix to avoid conflicts
        const fileExt = file.name.split('.').pop();
        const fileName = `${clientId}-${Date.now()}.${fileExt}`;
        const storagePath = `client-logos/${clientId}/${fileName}`;
        
        // Upload the file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('client-assets')
          .upload(storagePath, file, {
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) {
          console.error("Error uploading logo file:", uploadError);
          throw new Error(`Error uploading logo: ${uploadError.message}`);
        }
        
        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
          .from('client-assets')
          .getPublicUrl(storagePath);
          
        const publicUrl = publicUrlData?.publicUrl || '';
        
        if (!publicUrl) {
          throw new Error("Failed to get public URL for uploaded logo");
        }
        
        console.log("Logo uploaded successfully. Public URL:", publicUrl);
        
        // Update the logo URL in the form data
        if (data.widget_settings) {
          data.widget_settings.logo_url = publicUrl;
          data.widget_settings.logo_storage_path = storagePath;
        } else {
          data.widget_settings = {
            logo_url: publicUrl,
            logo_storage_path: storagePath
          };
        }
        
        // Log the activity if logClientActivity is available
        if (logClientActivity) {
          await logClientActivity(
            "logo_uploaded" as ExtendedActivityType,
            "Logo uploaded for client",
            {
              logo_url: publicUrl,
              storage_path: storagePath
            } as Json
          );
        }
      } else if (data._tempLogoFile === null) {
        // User explicitly removed the logo
        console.log("Removing logo URL from client data");
        if (data.widget_settings) {
          data.widget_settings.logo_url = "";
          data.widget_settings.logo_storage_path = "";
        } else {
          data.widget_settings = {
            logo_url: "",
            logo_storage_path: ""
          };
        }
      }
      
      // Remove the temporary logo file from the data before updating the client
      const { _tempLogoFile, ...clientData } = data;
      
      // Update the client
      await updateClient(clientId, clientData as ClientFormData);
      
      // Log the activity if logClientActivity is available
      if (logClientActivity) {
        await logClientActivity(
          "client_updated" as ExtendedActivityType,
          `${isClientView ? 'Your' : 'Client'} information updated`,
          {
            client_name: data.client_name,
            email: data.email
          } as Json
        );
      }
      
      toast.success(`${isClientView ? 'Your' : 'Client'} information updated successfully!`);
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast.error(`Failed to update ${isClientView ? 'your' : 'client'} information: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return { handleSubmit, isLoading };
};
