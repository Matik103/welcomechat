
import { uploadWidgetLogo } from "@/utils/widgetSettingsUtils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { useClientData } from "./useClientData";
import { useAiAgentManagement } from "./useAiAgentManagement";

interface ClientFormData {
  client_name: string;
  email: string;
  agent_name?: string;
  logo_url?: string;
  logo_storage_path?: string;
  _tempLogoFile?: File | null;
}

export const useClientFormSubmission = (
  clientId: string | undefined,
  isClientView: boolean,
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>
) => {
  const navigate = useNavigate();
  const { clientMutation, refetchClient } = useClientData(clientId);
  const { ensureAiAgentExists } = useAiAgentManagement();

  const handleSubmit = async (data: ClientFormData) => {
    try {
      console.log("Submitting client form data:", data);
      
      const tempLogoFile = data._tempLogoFile;
      delete data._tempLogoFile;
      
      // Get agent description from the widget settings if available
      const widgetSettings = typeof data.widget_settings === 'object' && data.widget_settings !== null 
        ? data.widget_settings
        : {};
      
      const agentDescription = typeof widgetSettings === 'object' && widgetSettings !== null 
        ? (widgetSettings as any).agent_description || ""
        : "";
      
      if (clientId && isClientView) {
        await clientMutation.mutateAsync({
          client_name: data.client_name,
          email: data.email,
          agent_name: data.agent_name || 'AI Assistant',
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path
        });
        
        let agentUpdateResult = { updated: false, created: false, descriptionUpdated: false, nameUpdated: false };
        agentUpdateResult = await ensureAiAgentExists(
          clientId, 
          data.agent_name,
          agentDescription,
          data.logo_url,
          data.logo_storage_path,
          data.client_name
        );
        
        refetchClient();
        
        try {
          if (agentUpdateResult.created) {
            await logClientActivity(
              "ai_agent_created", 
              "created a new AI agent",
              { 
                agent_name: data.agent_name,
                agent_description: agentDescription,
                logo_url: data.logo_url
              }
            );
          } else if (agentUpdateResult.nameUpdated || agentUpdateResult.descriptionUpdated) {
            await logClientActivity(
              "ai_agent_updated", 
              "updated their AI agent settings",
              { 
                agent_name: data.agent_name,
                agent_description: agentDescription,
                logo_url: data.logo_url,
                name_changed: agentUpdateResult.nameUpdated,
                description_changed: agentUpdateResult.descriptionUpdated
              }
            );
          } else {
            const updatedFields = [];
            if (data.client_name !== data.client_name) updatedFields.push('client_name');
            if (data.email !== data.email) updatedFields.push('email');
            if (data.logo_url !== data.logo_url) updatedFields.push('logo_url');
            
            if (updatedFields.length > 0) {
              await logClientActivity(
                "client_updated", 
                "updated their client information",
                { updated_fields: updatedFields }
              );
            }
          }
        } catch (logError) {
          console.error("Error logging activity:", logError);
        }
        
        toast.success("Client information saved successfully");
      } else if (clientId) {
        await clientMutation.mutateAsync({
          client_name: data.client_name,
          email: data.email,
          agent_name: data.agent_name || 'AI Assistant',
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path
        });
        
        await ensureAiAgentExists(
          clientId, 
          data.agent_name,
          agentDescription,
          data.logo_url,
          data.logo_storage_path,
          data.client_name
        );
        
        toast.success("Client updated successfully");
        navigate("/admin/clients");
      } else {
        const toastId = "client-creation";
        toast.loading("Creating client account...", { id: toastId });
        
        try {
          const result = await clientMutation.mutateAsync({
            client_name: data.client_name,
            email: data.email,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path
          });
          
          let logoUrl = "";
          let logoStoragePath = "";
          
          if (tempLogoFile && typeof result === 'object' && 'clientId' in result && result.clientId) {
            try {
              const uploadResult = await uploadWidgetLogo(tempLogoFile, result.clientId);
              logoUrl = uploadResult.publicUrl;
              logoStoragePath = uploadResult.storagePath;
              
              await supabase
                .from("clients")
                .update({
                  logo_url: logoUrl,
                  logo_storage_path: logoStoragePath,
                  widget_settings: {
                    logo_url: logoUrl,
                    logo_storage_path: logoStoragePath,
                    agent_description: ""
                  }
                })
                .eq("id", result.clientId);
                
              console.log("Updated client with logo:", logoUrl);
            } catch (logoError) {
              console.error("Error uploading logo:", logoError);
            }
          }
          
          if (typeof result === 'object' && 'clientId' in result) {
            if (result.clientId) {
              await ensureAiAgentExists(
                result.clientId, 
                data.agent_name,
                "",  // New clients don't have agent description yet
                data.logo_url,
                data.logo_storage_path,
                data.client_name
              );
            }
            
            if (result.emailSent) {
              toast.dismiss(toastId);
              toast.success("Client created and invitation email sent successfully");
            } else {
              toast.dismiss(toastId);
              const errorDetail = result.errorMessage ? `: ${result.errorMessage}` : "";
              toast.warning(`Client created but failed to send invitation email${errorDetail}. Please try sending it manually later.`);
            }
            
            navigate("/admin/clients");
          } else {
            toast.dismiss(toastId);
            toast.success("Client created successfully");
            navigate("/admin/clients");
          }
        } catch (createError: any) {
          toast.dismiss(toastId);
          console.error("Error creating client:", createError);
          toast.error(`Failed to create client: ${createError.message}`);
        }
      }
    } catch (error: any) {
      console.error("Error submitting client form:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Error stack:", error.stack);
      const errorDetails = error?.code ? ` (${error.code}: ${error.message})` : "";
      toast.error("Failed to save client information" + (errorDetails || ": " + (error?.message || "Unknown error")));
    }
  };

  return {
    handleSubmit,
    isLoading: clientMutation.isPending
  };
};
