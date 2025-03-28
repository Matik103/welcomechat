import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAiAgentManagement() {
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const queryClient = useQueryClient();

  /**
   * Create or update an AI agent for a client
   */
  const ensureAiAgentExists = async (
    clientId: string,
    agentName: string,
    description?: string,
    logoUrl?: string,
    logoStoragePath?: string,
    clientName?: string,
    skipActivityLog = false
  ) => {
    setIsCreating(true);
    setError(null);
    let created = false;
    
    try {
      // Check if agent exists
      const { data: existingAgents, error: fetchError } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('client_id', clientId)
        .eq('name', agentName)
        .eq('interaction_type', 'config')
        .is('deleted_at', null)
        .limit(1);
      
      if (fetchError) throw fetchError;
      
      if (!existingAgents || existingAgents.length === 0) {
        // Create new agent
        const { error: insertError } = await supabase
          .from('ai_agents')
          .insert({
            client_id: clientId,
            name: agentName,
            description: description || '',
            logo_url: logoUrl || '',
            logo_storage_path: logoStoragePath || '',
            client_name: clientName || '',
            interaction_type: 'config',
            last_active: new Date().toISOString(),
            status: 'active'
          });
        
        if (insertError) throw insertError;
        created = true;
        
        // Log to console instead of creating activity
        if (!skipActivityLog) {
          console.log("[Activity Log] AI Agent created", {
            client_id: clientId,
            agent_name: agentName,
            type: "ai_agent_created"
          });
        }
      } else {
        // Update existing agent
        const { error: updateError } = await supabase
          .from('ai_agents')
          .update({
            description: description !== undefined ? description : existingAgents[0].description,
            logo_url: logoUrl !== undefined ? logoUrl : existingAgents[0].logo_url,
            logo_storage_path: logoStoragePath !== undefined ? logoStoragePath : existingAgents[0].logo_storage_path,
            client_name: clientName !== undefined ? clientName : existingAgents[0].client_name,
            last_active: new Date().toISOString()
          })
          .eq('client_id', clientId)
          .eq('name', agentName)
          .eq('interaction_type', 'config');
        
        if (updateError) throw updateError;
        
        // Log to console instead of creating activity
        if (!skipActivityLog) {
          console.log("[Activity Log] AI Agent updated", {
            client_id: clientId,
            agent_name: agentName,
            type: "ai_agent_updated"
          });
        }
      }
      
      return { success: true, created, error: null };
    } catch (err) {
      console.error("Error ensuring AI agent exists:", err);
      setError(err instanceof Error ? err : new Error('Failed to create/update AI agent'));
      return { success: false, created, error: err };
    } finally {
      setIsCreating(false);
    }
  };
  
  const updateAgentStatusMutation = useMutation(
    async ({ clientId, agentName, status }: { clientId: string; agentName: string; status: 'active' | 'inactive' | 'deleted' }) => {
      setIsUpdating(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('ai_agents')
        .update({ status, deleted_at: status === 'deleted' ? new Date().toISOString() : null })
        .eq('client_id', clientId)
        .eq('name', agentName)
        .eq('interaction_type', 'config');
      
      if (error) {
        console.error("Error updating agent status:", error);
        throw error;
      }
      
      return data;
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['ai-agents']);
      },
      onSettled: () => {
        setIsUpdating(false);
      },
    }
  );

  const deleteAiAgent = async (clientId: string, agentName: string) => {
    setIsDeleting(true);
    setError(null);
    
    try {
      // First, update the agent status to 'deleted'
      await updateAgentStatusMutation.mutateAsync({ clientId, agentName, status: 'deleted' });
      
      // Log to console instead of creating activity
      console.log("[Activity Log] AI Agent deleted", {
        client_id: clientId,
        agent_name: agentName,
        type: "ai_agent_deleted"
      });
      
      return { success: true, error: null };
    } catch (err) {
      console.error("Error deleting AI Agent:", err);
      setError(err instanceof Error ? err : new Error('Failed to delete AI Agent'));
      return { success: false, error: err };
    } finally {
      setIsDeleting(false);
    }
  };

  const processWebsiteUrls = async (clientId: string, websiteUrlId: number) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Call the Supabase function to process the website URLs
      const { data, error: functionError } = await supabase.functions.invoke('process-website', {
        body: {
          client_id: clientId,
          website_url_id: websiteUrlId
        }
      });

      if (functionError) {
        console.error('Function invoke error:', functionError);
        throw new Error(`Failed to process website URLs: ${functionError.message}`);
      }

      console.log('Function response:', data);
      return { success: true, data, error: null };
    } catch (err) {
      console.error("Error processing website URLs:", err);
      setError(err instanceof Error ? err : new Error('Failed to process website URLs'));
      return { success: false, error: err };
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isCreating,
    isUpdating,
    isDeleting,
    isProcessing,
    error,
    ensureAiAgentExists,
    deleteAiAgent,
    processWebsiteUrls,
    updateAgentStatusMutation
  };
}
