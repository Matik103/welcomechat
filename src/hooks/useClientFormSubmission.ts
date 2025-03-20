
import { useState } from "react";
import { useClientMutation } from "./useClientMutation";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

export const useClientFormSubmission = (
  clientId: string | undefined,
  isClientView: boolean,
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>
) => {
  const [isLoading, setIsLoading] = useState(false);
  const clientMutation = useClientMutation(clientId);
  
  const handleSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Check for agent name or description changes to log appropriate activity
      const widgetSettings = data.widget_settings || {};

      await clientMutation.mutateAsync(data);
      
      // Log activity based on user role and changes made
      if (isClientView) {
        await logClientActivity(
          "client_updated", 
          "Updated client information",
          {
            widget_settings: {
              agent_name: widgetSettings.agent_name,
              agent_description: widgetSettings.agent_description,
              logo_url: widgetSettings.logo_url
            }
          }
        );
        toast.success("Your information has been updated");
      } else {
        if (clientId) {
          toast.success("Client updated successfully");
        } else {
          toast.success("Client created successfully and invitation sent");
        }
      }
    } catch (error: any) {
      console.error("Error submitting client form:", error);
      toast.error(`Failed to ${clientId ? "update" : "create"} client: ${error.message}`);
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
