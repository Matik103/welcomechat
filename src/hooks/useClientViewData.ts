
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useClient } from '@/hooks/useClient';
import { useClientChatHistory } from '@/hooks/useClientChatHistory';
import { execSql } from '@/utils/rpcUtils';
import { ChatInteraction } from '@/types/agent';

// Define types for error logs and queries to fix TypeScript errors
interface ErrorLog {
  id: string;
  error_type?: string;
  message?: string;
  status?: string;
  query_text?: string;
  created_at?: string;
}

interface QueryItem {
  query_text: string;
  frequency: number;
  id: string;
  last_asked: string;
}

export const useClientViewData = (clientId: string) => {
  const { client, isLoading: isLoadingClient, error: clientError } = useClient(clientId);
  const { chatHistory, isLoading: isLoadingChatHistory } = useClientChatHistory(clientId);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [commonQueries, setCommonQueries] = useState<QueryItem[]>([]);
  const [isLoadingErrorLogs, setIsLoadingErrorLogs] = useState(true);
  const [isLoadingCommonQueries, setIsLoadingCommonQueries] = useState(true);
  const [agentStats, setAgentStats] = useState({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    success_rate: 100
  });

  // Show client error toast only once
  useEffect(() => {
    if (clientError) {
      toast.error("Failed to load client information");
      console.error("Client error:", clientError);
    }
  }, [clientError]);

  useEffect(() => {
    const fetchErrorLogs = async () => {
      if (!clientId) return;
      
      try {
        setIsLoadingErrorLogs(true);
        
        // Get error logs directly from ai_agents table
        const { data, error } = await supabase
          .from('ai_agents')
          .select('id, error_type, error_message, error_status, query_text, created_at')
          .eq('client_id', clientId)
          .eq('is_error', true)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('Error fetching error logs:', error);
        } else if (data) {
          // Transform data to match the expected shape
          const formattedLogs: ErrorLog[] = data.map(item => ({
            id: item.id,
            error_type: item.error_type,
            message: item.error_message,
            status: item.error_status,
            query_text: item.query_text,
            created_at: item.created_at
          }));
          setErrorLogs(formattedLogs);
        }
      } catch (error) {
        console.error('Error fetching error logs:', error);
      } finally {
        setIsLoadingErrorLogs(false);
      }
    };
    
    const fetchCommonQueries = async () => {
      if (!clientId) return;
      
      try {
        setIsLoadingCommonQueries(true);
        
        // Get common queries directly from ai_agents table
        const { data, error } = await supabase
          .from('ai_agents')
          .select('query_text, id, created_at')
          .eq('client_id', clientId)
          .eq('interaction_type', 'chat_interaction')
          .not('query_text', 'is', null)
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) {
          console.error('Error fetching common queries:', error);
        } else if (data) {
          // Process and count frequencies
          const queryMap = new Map<string, { frequency: number, id: string, last_asked: string }>();
          data.forEach(item => {
            if (item.query_text) {
              if (!queryMap.has(item.query_text)) {
                queryMap.set(item.query_text, {
                  frequency: 1,
                  id: item.id,
                  last_asked: item.created_at || ''
                });
              } else {
                const entry = queryMap.get(item.query_text);
                if (entry) {
                  entry.frequency += 1;
                  if (item.created_at && new Date(item.created_at) > new Date(entry.last_asked || '')) {
                    entry.last_asked = item.created_at;
                  }
                }
              }
            }
          });
          
          // Convert map to array
          const result: QueryItem[] = Array.from(queryMap.entries()).map(([query_text, data]) => ({
            query_text,
            frequency: data.frequency,
            id: data.id,
            last_asked: data.last_asked
          }));
          
          // Sort by frequency
          result.sort((a, b) => b.frequency - a.frequency);
          
          setCommonQueries(result);
        }
      } catch (error) {
        console.error('Error fetching common queries:', error);
      } finally {
        setIsLoadingCommonQueries(false);
      }
    };

    const fetchAgentStats = async () => {
      if (!clientId || !client?.agent_name) return;
      
      try {
        // Get basic stats directly
        const { data: interactions, error: interactionsError } = await supabase
          .from('ai_agents')
          .select('response_time_ms')
          .eq('client_id', clientId)
          .eq('interaction_type', 'chat_interaction')
          .not('response_time_ms', 'is', null);
        
        if (interactionsError) {
          console.error('Error fetching agent stats:', interactionsError);
          return;
        }
        
        // Calculate response time average
        let totalResponseTime = 0;
        if (interactions) {
          interactions.forEach(item => {
            if (item.response_time_ms) {
              totalResponseTime += item.response_time_ms;
            }
          });
        }
        
        const avgResponseTime = interactions?.length 
          ? Math.round(totalResponseTime / interactions.length) 
          : 0;
        
        // Get unique days
        const { data: uniqueDays, error: daysError } = await supabase
          .from('ai_agents')
          .select('created_at')
          .eq('client_id', clientId)
          .eq('interaction_type', 'chat_interaction');
        
        if (daysError) {
          console.error('Error fetching agent days stats:', daysError);
          return;
        }
        
        // Count unique days
        const days = new Set();
        if (uniqueDays) {
          uniqueDays.forEach(item => {
            if (item.created_at) {
              const date = new Date(item.created_at).toDateString();
              days.add(date);
            }
          });
        }
        
        // Update stats
        setAgentStats({
          total_interactions: interactions?.length || 0,
          active_days: days.size,
          average_response_time: avgResponseTime,
          success_rate: 100
        });
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
    };
    
    if (clientId) {
      fetchErrorLogs();
      fetchCommonQueries();
    }

    if (clientId && client) {
      fetchAgentStats();
    }
  }, [clientId, client]);

  // Subscribe to updates
  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`client-${clientId}-updates`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ai_agents',
          filter: `client_id=eq.${clientId}`
        },
        () => {
          const fetchErrorLogs = async () => {
            try {
              const { data, error } = await supabase
                .from('ai_agents')
                .select('id, error_type, error_message, error_status, query_text, created_at')
                .eq('client_id', clientId)
                .eq('is_error', true)
                .order('created_at', { ascending: false })
                .limit(10);
              
              if (error) {
                console.error('Error refetching error logs:', error);
              } else if (data) {
                // Transform data to match the expected shape
                const formattedLogs: ErrorLog[] = data.map(item => ({
                  id: item.id,
                  error_type: item.error_type,
                  message: item.error_message,
                  status: item.error_status,
                  query_text: item.query_text,
                  created_at: item.created_at
                }));
                setErrorLogs(formattedLogs);
              }
            } catch (error) {
              console.error('Error refetching error logs:', error);
            }
          };
          
          fetchErrorLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  return {
    client,
    isLoadingClient,
    clientError,
    chatHistory,
    isLoadingChatHistory,
    errorLogs,
    isLoadingErrorLogs,
    commonQueries,
    isLoadingCommonQueries,
    agentStats
  };
};
