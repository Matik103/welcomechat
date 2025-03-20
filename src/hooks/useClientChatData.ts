
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";
import { useState, useEffect } from "react";

// Get chat history for a client
export const useChatHistory = (clientId: string | undefined, limit: number = 10) => {
  return useQuery({
    queryKey: ["chat-history", clientId, limit],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        console.log(`Fetching chat history for client: ${clientId}, limit: ${limit}`);
        
        // First get the agent name for this client
        const { data: agentData, error: agentError } = await supabase
          .from("ai_agents")
          .select("name")
          .eq("id", clientId)
          .single();
          
        if (agentError) {
          console.error("Error fetching agent name:", agentError);
          return [];
        }
        
        const agentName = agentData?.name;
        
        if (!agentName) {
          console.warn("No agent name found for client:", clientId);
          return [];
        }
        
        // Get chat interactions for this agent from ai_agents table
        const { data, error } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("client_id", clientId)
          .eq("name", agentName)
          .eq("interaction_type", "chat_interaction")
          .order("created_at", { ascending: false })
          .limit(limit);
          
        if (error) {
          console.error("Error fetching chat history:", error);
          throw error;
        }
        
        // Transform the data into ChatInteraction format
        const chatHistory: ChatInteraction[] = (data || []).map(item => ({
          id: item.id,
          client_id: item.client_id,
          agent_name: item.name,
          query: item.query_text || "",
          response: item.content || "",
          created_at: item.created_at,
          metadata: item.settings || {},
        }));
        
        return chatHistory;
      } catch (error) {
        console.error("Error in useChatHistory:", error);
        return [];
      }
    },
    enabled: !!clientId,
  });
};

// Get chat sessions/days for a client
export const useChatSessions = (clientId: string | undefined) => {
  return useQuery({
    queryKey: ["chat-sessions", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      try {
        // Get the agent name for this client
        const { data: agentData, error: agentError } = await supabase
          .from("ai_agents")
          .select("name")
          .eq("id", clientId)
          .single();
          
        if (agentError) {
          console.error("Error fetching agent name for sessions:", agentError);
          return [];
        }
        
        const agentName = agentData?.name;
        
        if (!agentName) {
          console.warn("No agent name found for client sessions:", clientId);
          return [];
        }
        
        // Get distinct dates with chat interactions
        const { data, error } = await supabase
          .rpc('get_chat_sessions', { 
            client_id_param: clientId,
            agent_name_param: agentName
          });
          
        if (error) {
          console.error("Error fetching chat sessions:", error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error("Error in useChatSessions:", error);
        return [];
      }
    },
    enabled: !!clientId,
  });
};

// Get chat interactions for a specific day
export const useDailyChatInteractions = (clientId: string | undefined, date: string | null) => {
  return useQuery({
    queryKey: ["daily-chat", clientId, date],
    queryFn: async () => {
      if (!clientId || !date) return [];
      
      try {
        // Get the agent name for this client
        const { data: agentData, error: agentError } = await supabase
          .from("ai_agents")
          .select("name")
          .eq("id", clientId)
          .single();
          
        if (agentError) {
          console.error("Error fetching agent name for daily chat:", agentError);
          return [];
        }
        
        const agentName = agentData?.name;
        
        if (!agentName) {
          console.warn("No agent name found for client daily chat:", clientId);
          return [];
        }
        
        // Get chat interactions for the specified date
        const { data, error } = await supabase
          .from("ai_agents")
          .select("*")
          .eq("client_id", clientId)
          .eq("name", agentName)
          .eq("interaction_type", "chat_interaction")
          .gte("created_at", `${date}T00:00:00`)
          .lt("created_at", `${date}T23:59:59`)
          .order("created_at", { ascending: true });
          
        if (error) {
          console.error("Error fetching daily chat interactions:", error);
          throw error;
        }
        
        // Transform the data into ChatInteraction format
        const chatInteractions: ChatInteraction[] = (data || []).map(item => ({
          id: item.id,
          client_id: item.client_id,
          agent_name: item.name,
          query: item.query_text || "",
          response: item.content || "",
          created_at: item.created_at,
          metadata: item.settings || {},
        }));
        
        return chatInteractions;
      } catch (error) {
        console.error("Error in useDailyChatInteractions:", error);
        return [];
      }
    },
    enabled: !!clientId && !!date,
  });
};
