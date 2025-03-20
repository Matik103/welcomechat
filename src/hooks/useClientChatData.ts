
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";

/**
 * Hook to fetch chat history for a specific client
 */
export const useChatHistory = (clientId?: string, limit: number = 10) => {
  return useQuery({
    queryKey: ["chatHistory", clientId, limit],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        console.log(`Fetching chat history for client: ${clientId}, limit: ${limit}`);
        
        // First attempt: Try to get conversations from the client's interactions
        const { data, error } = await supabase
          .from("ai_interactions")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(limit);
        
        if (error) {
          console.error("Error fetching chat history:", error);
          throw error;
        }
        
        // Map the database records to our ChatInteraction type
        const interactions: ChatInteraction[] = (data || []).map(item => ({
          id: item.id,
          client_id: item.client_id,
          clientId: item.client_id, // Add this for compatibility
          agent_name: item.agent_name,
          query: item.query_text || "",
          response: item.response_text || "",
          created_at: item.created_at,
          timestamp: item.created_at, // Add this for compatibility
          metadata: item.metadata,
          responseTimeMs: item.response_time_ms
        }));
        
        console.log(`Found ${interactions.length} interactions for client ${clientId}`);
        
        return interactions;
      } catch (error) {
        console.error("Error in useChatHistory:", error);
        return [];
      }
    },
    enabled: !!clientId,
  });
};

/**
 * Hook to fetch chat sessions for a client
 */
export const useChatSessions = (clientId?: string) => {
  return useQuery({
    queryKey: ["chatSessions", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        console.log(`Fetching chat sessions for client: ${clientId}`);
        
        // Try using the stored procedure if it exists
        try {
          const { data: sessionData, error: sessionError } = await supabase.rpc(
            'get_chat_sessions_for_client',
            { client_id_param: clientId }
          );
          
          if (!sessionError && sessionData) {
            console.log(`Found ${sessionData.length} chat sessions via RPC`);
            return sessionData;
          }
        } catch (rpcError) {
          console.warn("RPC get_chat_sessions_for_client not available:", rpcError);
        }
        
        // Fallback: Get sessions by querying the interactions directly
        const { data, error } = await supabase
          .from("ai_interactions")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(50);
        
        if (error) {
          console.error("Error fetching chat sessions:", error);
          throw error;
        }
        
        // Group by session ID if available, or create artificial sessions by date
        const sessions = groupSessionsByDate(data || []);
        
        console.log(`Created ${sessions.length} artificial chat sessions`);
        
        return sessions;
      } catch (error) {
        console.error("Error in useChatSessions:", error);
        return [];
      }
    },
    enabled: !!clientId,
  });
};

/**
 * Hook to fetch recent chat interactions (usually for dashboard/preview)
 */
export const useRecentChatInteractions = (clientId?: string, limit: number = 5) => {
  return useQuery({
    queryKey: ["recentChatInteractions", clientId, limit],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        console.log(`Fetching recent chat interactions for client: ${clientId}`);
        
        const { data, error } = await supabase
          .from("ai_interactions")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(limit);
        
        if (error) {
          console.error("Error fetching recent chat interactions:", error);
          throw error;
        }
        
        // Map the database records to our ChatInteraction type
        const interactions: ChatInteraction[] = (data || []).map(item => ({
          id: item.id,
          client_id: item.client_id,
          clientId: item.client_id, // Add this for compatibility
          agent_name: item.agent_name,
          query: item.query_text || "",
          response: item.response_text || "",
          created_at: item.created_at,
          timestamp: item.created_at, // Add this for compatibility
          metadata: item.metadata,
          responseTimeMs: item.response_time_ms
        }));
        
        console.log(`Found ${interactions.length} recent interactions`);
        
        return interactions;
      } catch (error) {
        console.error("Error in useRecentChatInteractions:", error);
        return [];
      }
    },
    enabled: !!clientId,
  });
};

// Helper function to group sessions by date
const groupSessionsByDate = (interactions: any[]) => {
  const dayGroups: Record<string, any[]> = {};
  
  interactions.forEach(interaction => {
    const date = new Date(interaction.created_at).toLocaleDateString();
    
    if (!dayGroups[date]) {
      dayGroups[date] = [];
    }
    
    dayGroups[date].push(interaction);
  });
  
  return Object.entries(dayGroups).map(([date, interactions]) => ({
    id: date,
    date,
    interactions: interactions.length,
    last_interaction: interactions[0].created_at,
    first_interaction: interactions[interactions.length - 1].created_at
  }));
};
