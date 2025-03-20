import { useNavigate } from "react-router-dom";
import { Client } from "@/types/client";
import { ClientForm } from "@/components/client/ClientForm";
import { useClientData } from "@/hooks/useClientData";
import { ExtendedActivityType } from "@/types/activity";
import { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadWidgetLogo } from "@/utils/widgetSettingsUtils";

interface ClientDetailsProps {
  client: Client | null;
  clientId: string | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

interface AgentUpdateResult {
  updated: boolean;
  created: boolean;
  descriptionUpdated: boolean;
  nameUpdated: boolean;
}

export const ClientDetails = ({ 
  client, 
  clientId, 
  isClientView,
  logClientActivity 
}: ClientDetailsProps) => {
  const navigate = useNavigate();
  const { clientMutation, refetchClient } = useClientData(clientId);

  const ensureAiAgentExists = async (
    clientId: string, 
    agentName?: string,
    agentDescription?: string,
    logoUrl?: string,
    logoStoragePath?: string,
    clientName?: string
  ): Promise<AgentUpdateResult> => {
    try {
      console.log(`Ensuring AI agent exists for client ${clientId}`);
      console.log(`Agent name: ${agentName}`);
      console.log(`Agent description: ${agentDescription}`);
      console.log(`Client name: ${clientName}`);
      console.log(`Agent logo URL: ${logoUrl}`);
      
      // Use a default agent name if not provided
      const finalAgentName = agentName || 'AI';
      
      // Check if AI agent exists for this client
      const { data: existingAgents, error: queryError } = await supabase
        .from("ai_agents")
        .select("id, name, agent_description")
        .eq("client_id", clientId)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (queryError) {
        console.error("Error checking for existing AI agent:", queryError);
        return { updated: false, created: false, descriptionUpdated: false, nameUpdated: false };
      }

      const settings = {
        agent_name: finalAgentName,
        agent_description: agentDescription || "",
        client_id: clientId,
        client_name: clientName || "",
        logo_url: logoUrl || "",
        logo_storage_path: logoStoragePath || "",
        updated_at: new Date().toISOString()
      };

      if (existingAgents && existingAgents.length > 0) {
        const existingAgent = existingAgents[0];
        const nameChanged = existingAgent.name !== finalAgentName;
        const descriptionChanged = existingAgent.agent_description !== agentDescription;
        
        const { error: updateError } = await supabase
          .from("ai_agents")
          .update({ 
            name: finalAgentName,
            agent_description: agentDescription || "",
            content: "",
            interaction_type: "config",
            settings: settings,
            logo_url: logoUrl || "",
            logo_storage_path: logoStoragePath || "",
            updated_at: new Date().toISOString()
          })
          .eq("id", existingAgent.id);
        
        if (updateError) {
          console.error("Error updating AI agent:", updateError);
          throw updateError;
        } else {
          console.log(`Updated agent name to: ${finalAgentName}`);
          console.log(`Updated agent description to: ${agentDescription}`);
          console.log(`Updated agent logo URL to: ${logoUrl}`);
          
          return { 
            updated: true, 
            created: false, 
            descriptionUpdated: descriptionChanged,
            nameUpdated: nameChanged
          };
        }
      } else {
        const { error: insertError } = await supabase
          .from("ai_agents")
          .insert({
            client_id: clientId,
            name: finalAgentName,
            agent_description: agentDescription || "",
            content: "",
            interaction_type: "config",
            settings: settings,
            logo_url: logoUrl || "",
            logo_storage_path: logoStoragePath || "",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("Error creating new AI agent:", insertError);
          throw insertError;
        } else {
          console.log(`Created new AI agent with name: ${finalAgentName}`);
          console.log(`Set agent description to: ${agentDescription}`);
          console.log(`Set agent logo URL to: ${logoUrl}`);
          return { 
            updated: false, 
            created: true, 
            descriptionUpdated: true,
            nameUpdated: true
          };
        }
      }
    } catch (error) {
      console.error("Error in ensureAiAgentExists:", error);
      throw error;
    }
  };

  const handleSubmit = async (data: { 
    client_name: string; 
    email: string; 
    agent_name?: string;
    agent_description?: string;
    logo_url?: string;
    logo_storage_path?: string;
    _tempLogoFile?: File | null;
  }) => {
    try {
      console.log("ClientDetails submitting data:", data);
      
      const tempLogoFile = data._tempLogoFile;
      delete data._tempLogoFile;
      
      const nameChanged = client?.agent_name !== data.agent_name;
      const descriptionChanged = client?.agent_description !== data.agent_description;
      
      if (clientId && isClientView) {
        await clientMutation.mutateAsync({
          client_name: data.client_name,
          email: data.email,
          agent_name: data.agent_name || 'AI Assistant',
          agent_description: data.agent_description,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path
        });
        
        let agentUpdateResult = { updated: false, created: false, descriptionUpdated: false, nameUpdated: false };
        agentUpdateResult = await ensureAiAgentExists(
          clientId, 
          data.agent_name,
          data.agent_description,
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
                agent_description: data.agent_description,
                logo_url: data.logo_url
              }
            );
          } else if (agentUpdateResult.nameUpdated || agentUpdateResult.descriptionUpdated) {
            await logClientActivity(
              "ai_agent_updated", 
              "updated their AI agent settings",
              { 
                agent_name: data.agent_name,
                agent_description: data.agent_description,
                logo_url: data.logo_url,
                name_changed: agentUpdateResult.nameUpdated,
                description_changed: agentUpdateResult.descriptionUpdated
              }
            );
          } else {
            const updatedFields = [];
            if (client?.client_name !== data.client_name) updatedFields.push('client_name');
            if (client?.email !== data.email) updatedFields.push('email');
            if (client?.logo_url !== data.logo_url) updatedFields.push('logo_url');
            
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
          agent_description: data.agent_description,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path
        });
        
        await ensureAiAgentExists(
          clientId, 
          data.agent_name,
          data.agent_description,
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
            agent_description: data.agent_description,
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
                    agent_description: data.agent_description || ""
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
                data.agent_description,
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isLoading={clientMutation.isPending}
        isClientView={isClientView}
      />
    </div>
  );
};
