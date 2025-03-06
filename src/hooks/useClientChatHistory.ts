
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatInteraction } from "@/types/agent";

export const useClientChatHistory = (agentName: string | undefined) => {
  return useQuery<ChatInteraction[]>({
    queryKey: ["chat-history", agentName],
    queryFn: async (): Promise<ChatInteraction[]> => {
      if (!agentName) return [];
      
      try {
        console.log("Fetching chat history for agent:", agentName);
        
        // First try a generic table approach
        const { data: chatData, error } = await supabase
          .from('chat_interactions')
          .select('id, content, metadata')
          .eq('agent_name', agentName)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (!error && chatData && chatData.length > 0) {
          console.log("Found chat data in chat_interactions table:", chatData.length);
          return chatData.map(row => ({
            id: Number(row.id),
            content: row.content || '',
            metadata: {
              timestamp: row.metadata?.timestamp || new Date().toISOString(),
              user_message: row.metadata?.user_message || '',
              type: row.metadata?.type || 'chat_interaction'
            }
          }));
        }
        
        // Fallback to agent-specific tables if necessary
        console.log("Trying agent-specific tables for:", agentName);
        let query;
        const safeAgentName = agentName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        try {
          // Dynamic query based on agent name
          const { data: tableData, error: tableError } = await supabase
            .from(safeAgentName)
            .select('id, content, metadata')
            .eq('metadata->>type', 'chat_interaction')
            .order('id', { ascending: false })
            .limit(10);
            
          if (!tableError && tableData && tableData.length > 0) {
            console.log(`Found data in ${safeAgentName} table:`, tableData.length);
            return tableData.map(row => ({
              id: Number(row.id),
              content: row.content || '',
              metadata: {
                timestamp: row.metadata?.timestamp || new Date().toISOString(),
                user_message: row.metadata?.user_message || '',
                type: row.metadata?.type || 'chat_interaction'
              }
            }));
          }
          
          // If no data found or error occurred in specific table, return empty array
          console.log(`No data found in ${safeAgentName} table or table doesn't exist`);
          return [];
        } catch (specificError) {
          // Ignore errors from specific table queries as they might not exist
          console.log("Error querying agent-specific table:", specificError);
          return [];
        }
      } catch (error) {
        console.error("Error in chat history query:", error);
        return [];
      }
    },
    enabled: !!agentName,
    retry: 1,
    // Return empty array instead of undefined on error
    retryOnMount: true,
  });
};
