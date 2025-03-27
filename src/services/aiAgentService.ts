
import { supabase } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/client-admin";
import { AIAgent } from "@/types/supabase";
import { toast } from "sonner";

/**
 * Service for managing AI agents with proper error handling
 */
export const aiAgentService = {
  /**
   * Get an AI agent by ID
   */
  async getById(id: string): Promise<AIAgent | null> {
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching AI agent:", error);
        toast.error("Failed to fetch AI agent");
        return null;
      }

      return data as AIAgent;
    } catch (error) {
      console.error("Error in getById:", error);
      return null;
    }
  },

  /**
   * Get AI agents by client ID
   */
  async getByClientId(clientId: string): Promise<AIAgent[]> {
    try {
      const { data, error } = await supabase
        .from("ai_agents")
        .select("*")
        .eq("client_id", clientId)
        .eq("interaction_type", "config")
        .is("deleted_at", null);

      if (error) {
        console.error("Error fetching AI agents:", error);
        toast.error("Failed to fetch AI agents");
        return [];
      }

      return data as AIAgent[];
    } catch (error) {
      console.error("Error in getByClientId:", error);
      return [];
    }
  },

  /**
   * Create a new AI agent
   */
  async create(agent: Partial<AIAgent>): Promise<AIAgent | null> {
    try {
      // Ensure required fields
      if (!agent.client_id || !agent.name) {
        toast.error("Client ID and name are required");
        return null;
      }

      // Prepare agent data with required fields
      const agentData = {
        client_id: agent.client_id,
        name: agent.name, // This is required
        interaction_type: agent.interaction_type || 'config',
        status: agent.status || 'active',
        agent_description: agent.agent_description || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        settings: agent.settings || {},
        content: agent.content || '',
        logo_url: agent.logo_url || '',
        logo_storage_path: agent.logo_storage_path || '',
        ai_prompt: agent.ai_prompt || ''
      };

      // Use supabaseAdmin for admin operations requiring service role
      const { data, error } = await supabaseAdmin
        .from("ai_agents")
        .insert(agentData)
        .select()
        .single();

      if (error) {
        console.error("Error creating AI agent:", error);
        toast.error("Failed to create AI agent: " + error.message);
        return null;
      }

      // Log to console instead of database
      console.log(`[ACTIVITY LOG] AI agent created: ${agent.name}`);

      return data as AIAgent;
    } catch (error) {
      console.error("Error in create:", error);
      return null;
    }
  },

  /**
   * Update an AI agent
   */
  async update(id: string, updates: Partial<AIAgent>): Promise<AIAgent | null> {
    try {
      // Ensure updates include the updated_at timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from("ai_agents")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating AI agent:", error);
        toast.error("Failed to update AI agent");
        return null;
      }

      // Log to console instead of database
      console.log(`[ACTIVITY LOG] AI agent updated: ${updates.name || id}`);

      return data as AIAgent;
    } catch (error) {
      console.error("Error in update:", error);
      return null;
    }
  },

  /**
   * Delete an AI agent (soft delete)
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("ai_agents")
        .update({ 
          deleted_at: new Date().toISOString(),
          status: 'deleted'
        })
        .eq("id", id);

      if (error) {
        console.error("Error deleting AI agent:", error);
        toast.error("Failed to delete AI agent");
        return false;
      }

      // Log to console instead of database
      console.log(`[ACTIVITY LOG] AI agent deleted: ${id}`);

      return true;
    } catch (error) {
      console.error("Error in delete:", error);
      return false;
    }
  }
};
