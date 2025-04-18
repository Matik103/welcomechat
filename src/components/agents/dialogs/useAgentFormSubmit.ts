
import { toast } from 'sonner';
import { createOpenAIAssistant } from '@/utils/openAIUtils';
import { Agent } from '@/types/agent';

interface UseAgentFormSubmitProps {
  clientId: string | undefined;
  clientName: string;
  agentName: string;
  agentDescription: string;
  logoFile: File | null;
  logoPreview: string | null;
  setIsSubmitting: (value: boolean) => void;
  resetForm: () => void;
  onOpenChange: (open: boolean) => void;
  onAgentCreated: (agent: Agent) => void;
  ensureAiAgentExists: (
    clientId: string,
    agentName: string,
    agentDescription?: string,
    logoUrl?: string,
    logoPath?: string,
    clientName?: string
  ) => Promise<{
    success: boolean;
    agent?: any;
    error?: string;
  }>;
}

export function useAgentFormSubmit({
  clientId,
  clientName,
  agentName,
  agentDescription,
  logoFile,
  logoPreview,
  setIsSubmitting,
  resetForm,
  onOpenChange,
  onAgentCreated,
  ensureAiAgentExists
}: UseAgentFormSubmitProps) {
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientId) {
      toast.error('Client ID is required');
      return;
    }
    
    if (!agentName.trim()) {
      toast.error('Agent name is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload logo if provided
      let logoUrl = "";
      let logoPath = "";
      
      if (logoFile) {
        // Logic to upload logo would go here
        // For now, just use the preview as the URL
        logoUrl = logoPreview || "";
        logoPath = `/client-logos/${clientId}/${logoFile.name}`;
      }
      
      console.log('Creating agent with:', {
        clientId,
        agentName,
        agentDescription,
        clientName
      });
      
      // Create or update agent
      const { success, agent, error } = await ensureAiAgentExists(
        clientId,
        agentName,
        agentDescription,
        logoUrl,
        logoPath,
        clientName
      );
      
      if (!success || error) {
        throw new Error(error || 'Failed to create agent');
      }
      
      console.log('Agent created successfully:', agent);
      
      // Try to create OpenAI assistant
      try {
        await createOpenAIAssistant(clientId, agentName, agentDescription);
      } catch (openAiError) {
        console.error('Error creating OpenAI assistant:', openAiError);
        // Continue with agent creation even if OpenAI assistant creation fails
      }
      
      toast.success(`Agent "${agentName}" created successfully`);
      
      if (agent && onAgentCreated) {
        // Transform agent data to match our Agent interface
        const formattedAgent: Agent = {
          id: agent.id,
          client_id: agent.client_id,
          client_name: agent.client_name || clientName || '',
          name: agent.name,
          description: agent.description || '',
          status: agent.status,
          created_at: agent.created_at,
          updated_at: agent.updated_at,
          interaction_type: agent.interaction_type,
          agent_description: agent.agent_description || agentDescription || '',
          logo_url: agent.logo_url || logoUrl,
          logo_storage_path: agent.logo_storage_path || logoPath,
          settings: agent.settings,
          openai_assistant_id: agent.openai_assistant_id,
          total_interactions: 0,
          average_response_time: 0,
          last_active: agent.updated_at
        };
        
        // Make sure to pass the created agent back to parent component
        onAgentCreated(formattedAgent);
      }
      
      // Reset form
      resetForm();
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return { handleSubmit };
}
