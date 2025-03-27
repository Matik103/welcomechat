
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client-admin";
import { toast } from "sonner";

/**
 * Service for managing client AI agents
 */
export const clientAgentService = {
  /**
   * Create a new agent for a client
   */
  async createAgent(
    clientId: string,
    agentName: string,
    agentDescription: string = "",
    logoUrl: string = "",
    logoStoragePath: string = "",
    clientName: string = ""
  ) {
    try {
      // Prepare agent data
      const agentData = {
        client_id: clientId,
        name: agentName || 'AI Assistant',
        agent_description: agentDescription || '',
        interaction_type: 'config',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: {
          agent_name: agentName || 'AI Assistant',
          agent_description: agentDescription || '',
          client_id: clientId,
          client_name: clientName || "",
          logo_url: logoUrl || "",
          logo_storage_path: logoStoragePath || "",
        },
        content: '',
        logo_url: logoUrl || '',
        logo_storage_path: logoStoragePath || '',
        client_name: clientName || '',
        email: '', // Add empty email field to prevent null issues
      };

      // Use admin supabase client for operations requiring service role
      const { data, error } = await supabaseAdmin
        .from("ai_agents")
        .insert(agentData)
        .select()
        .single();

      if (error) {
        console.error("Error creating AI agent:", error);
        toast.error("Failed to create AI agent");
        return { success: false, data: null, error };
      }

      // Log to console rather than trying to insert into activities table
      // This avoids the enum validation issue completely
      console.log(`AI agent created: ${agentName}`, {
        actionType: 'agent_created',
        agent_name: agentName,
        client_id: clientId
      });

      return { success: true, data, error: null };
    } catch (error) {
      console.error("Error in createAgent:", error);
      return { success: false, data: null, error };
    }
  }
};
