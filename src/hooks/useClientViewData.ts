import { useEffect, useState } from 'react';
import { useClientData } from './useClientData';
import { supabase } from '@/integrations/supabase/client';
import { fetchTopQueries } from '@/services/topQueriesService';
import { fetchErrorLogs } from '@/services/errorLogService';
import { ErrorLog, QueryItem } from '@/types/client-dashboard';
import { ChatInteraction } from '@/types/agent';
import { getInteractionStats } from '@/services/statsService';

export const useClientViewData = (clientId: string) => {
  const { client, isLoadingClient, error: clientError } = useClientData(clientId);
  
  // State for agent data
  const [agentStats, setAgentStats] = useState({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    success_rate: 100
  });
  
  // State for error logs
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isLoadingErrorLogs, setIsLoadingErrorLogs] = useState(true);
  
  // State for chat history
  const [chatHistory, setChatHistory] = useState<ChatInteraction[]>([]);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(true);
  
  // State for common queries
  const [commonQueries, setCommonQueries] = useState<QueryItem[]>([]);
  const [isLoadingCommonQueries, setIsLoadingCommonQueries] = useState(true);
  
  // Load error logs
  useEffect(() => {
    const loadErrorLogs = async () => {
      if (!clientId) return;
      
      try {
        setIsLoadingErrorLogs(true);
        const logs = await fetchErrorLogs(clientId);
        
        // Ensure we have valid ErrorLog objects
        const validLogs: ErrorLog[] = logs.filter(log => 
          typeof log === 'object' && log !== null && 'id' in log
        ) as ErrorLog[];
        
        setErrorLogs(validLogs);
      } catch (error) {
        console.error('Error loading error logs:', error);
        setErrorLogs([]);
      } finally {
        setIsLoadingErrorLogs(false);
      }
    };
    
    loadErrorLogs();
  }, [clientId]);
  
  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!clientId) return;
      
      try {
        setIsLoadingChatHistory(true);
        
        const { data, error } = await supabase
          .from('ai_agents')
          .select('id, query_text, content, created_at, name, response_time_ms')
          .eq('client_id', clientId)
          .eq('interaction_type', 'chat_interaction')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        const history: ChatInteraction[] = data.map(item => ({
          id: item.id,
          client_id: clientId,
          query_text: item.query_text || '',
          response: item.content || '',
          created_at: item.created_at || new Date().toISOString(),
          agent_name: item.name || 'AI Assistant',
          response_time_ms: item.response_time_ms || 0
        }));
        
        setChatHistory(history);
      } catch (error) {
        console.error('Error loading chat history:', error);
        setChatHistory([]);
      } finally {
        setIsLoadingChatHistory(false);
      }
    };
    
    loadChatHistory();
  }, [clientId]);
  
  // Load common queries
  useEffect(() => {
    const loadCommonQueries = async () => {
      if (!clientId) return;
      
      try {
        setIsLoadingCommonQueries(true);
        const queries = await fetchTopQueries(clientId);
        
        // Map to QueryItem type with defaults for null values
        const safeQueries: QueryItem[] = queries.map(q => ({
          id: q.id,
          query_text: q.query_text,
          frequency: q.frequency || 0,
          last_asked: q.last_asked || undefined,
          created_at: q.created_at || undefined
        }));
        
        setCommonQueries(safeQueries);
      } catch (error) {
        console.error('Error loading common queries:', error);
        setCommonQueries([]);
      } finally {
        setIsLoadingCommonQueries(false);
      }
    };
    
    loadCommonQueries();
  }, [clientId]);
  
  // Load agent stats
  useEffect(() => {
    const loadAgentStats = async () => {
      if (!clientId) return;
      
      try {
        const agentName = client?.agent_name || client?.name || 'AI Assistant';
        const stats = await getInteractionStats(clientId, agentName);
        
        setAgentStats({
          total_interactions: stats.total_interactions || 0,
          active_days: stats.active_days || 0,
          average_response_time: stats.average_response_time || 0,
          success_rate: stats.success_rate || 100,
        });
      } catch (error) {
        console.error('Error loading agent stats:', error);
        // Keep default values
      }
    };
    
    if (client) {
      loadAgentStats();
    }
  }, [clientId, client]);
  
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
