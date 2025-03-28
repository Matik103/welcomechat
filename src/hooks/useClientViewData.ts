
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';
import { useClient } from '@/hooks/useClient';
import { useClientChatHistory } from '@/hooks/useClientChatHistory';
import { execSql } from '@/utils/rpcUtils';
import { ChatInteraction } from '@/types/agent';

export const useClientViewData = (clientId: string) => {
  const { client, isLoading: isLoadingClient, error: clientError } = useClient(clientId);
  const { chatHistory, isLoading: isLoadingChatHistory } = useClientChatHistory(clientId);
  const [errorLogs, setErrorLogs] = useState([]);
  const [commonQueries, setCommonQueries] = useState([]);
  const [isLoadingErrorLogs, setIsLoadingErrorLogs] = useState(true);
  const [isLoadingCommonQueries, setIsLoadingCommonQueries] = useState(true);
  const [agentStats, setAgentStats] = useState({
    total_interactions: 0,
    active_days: 0,
    average_response_time: 0,
    success_rate: 100
  });

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
        
        const query = `
          SELECT id, error_type, error_message, error_status, query_text, created_at
          FROM ai_agents
          WHERE client_id = '${clientId}' 
          AND is_error = true
          ORDER BY created_at DESC
          LIMIT 10
        `;
        
        const result = await execSql(query);
        
        if (result && Array.isArray(result)) {
          setErrorLogs(result);
        }
      } catch (error) {
        console.error('Error fetching error logs:', error);
        toast.error("Failed to load error logs");
      } finally {
        setIsLoadingErrorLogs(false);
      }
    };
    
    const fetchCommonQueries = async () => {
      if (!clientId) return;
      
      try {
        setIsLoadingCommonQueries(true);
        
        const query = `
          SELECT query_text, COUNT(*) as frequency, MAX(created_at) as last_asked, id
          FROM ai_agents
          WHERE client_id = '${clientId}'
          AND interaction_type = 'chat_interaction'
          AND query_text IS NOT NULL
          GROUP BY query_text, id
          ORDER BY frequency DESC
          LIMIT 10
        `;
        
        const result = await execSql(query);
        
        if (result && Array.isArray(result)) {
          setCommonQueries(result);
        }
      } catch (error) {
        console.error('Error fetching common queries:', error);
        toast.error("Failed to load common queries");
      } finally {
        setIsLoadingCommonQueries(false);
      }
    };

    const fetchAgentStats = async () => {
      if (!clientId || !client?.agent_name) return;
      
      try {
        const query = `
          SELECT 
            get_agent_dashboard_stats('${clientId}', '${client.agent_name || client.name}')
        `;
        
        const result = await execSql(query);
        console.log('Raw agent stats result:', result);
        
        if (result && Array.isArray(result) && result.length > 0) {
          let statsData = null;
          const rawStats = result[0];
          
          if (typeof rawStats === 'string') {
            try {
              statsData = JSON.parse(rawStats);
            } catch (e) {
              console.error('Error parsing stats JSON string:', e);
            }
          } else if (typeof rawStats === 'object' && rawStats !== null) {
            statsData = rawStats;
            
            const possibleJsonProperty = Object.values(rawStats)[0];
            if (typeof possibleJsonProperty === 'string') {
              try {
                const parsed = JSON.parse(possibleJsonProperty);
                if (parsed && typeof parsed === 'object') {
                  statsData = parsed;
                }
              } catch (e) {
                console.error('Error trying to parse property as JSON:', e);
              }
            }
          }
          
          console.log('Processed agent stats data:', statsData);
          
          if (statsData) {
            setAgentStats({
              total_interactions: statsData.total_interactions || 0,
              active_days: statsData.active_days || 0,
              average_response_time: statsData.average_response_time || 0,
              success_rate: 100
            });
          }
        }
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
              const query = `
                SELECT id, error_type, error_message, error_status, query_text, created_at
                FROM ai_agents
                WHERE client_id = '${clientId}' 
                AND is_error = true
                ORDER BY created_at DESC
                LIMIT 10
              `;
              
              const result = await execSql(query);
              
              if (result && Array.isArray(result)) {
                setErrorLogs(result);
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
