import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Settings, 
  Edit,
  User,
  Bot,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { execSql } from '@/utils/rpcUtils';
import { useClientChatHistory } from '@/hooks/useClientChatHistory';
import { ChatInteraction } from '@/types/agent';
import { formatDate } from '@/utils/stringUtils';
import { useClient } from '@/hooks/useClient';
import { ErrorLogList } from '@/components/client-dashboard/ErrorLogList';
import { QueryList } from '@/components/client-dashboard/QueryList';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { ClientInfoCard } from '@/components/client-view/ClientInfoCard';

const ClientView = () => {
  const navigate = useNavigate();
  const { clientId = '' } = useParams();
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

  const handleGoBack = () => {
    navigate('/admin/clients');
  };

  if (!clientId) {
    return (
      <div className="container py-12 text-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Client ID Missing</h1>
        <p className="mb-8">No client ID was provided.</p>
        <Button asChild>
          <Link to="/admin/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  if (isLoadingClient) {
    return (
      <div className="container py-12 flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container py-12 text-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
        <p className="mb-8">The client you are looking for could not be found.</p>
        <Button asChild>
          <Link to="/admin/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4 flex items-center gap-1"
        onClick={handleGoBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Clients
      </Button>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <PageHeading>{client.client_name}</PageHeading>
          <p className="text-muted-foreground">
            <span className="font-medium">{client.name || client.agent_name}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/admin/clients/${clientId}/edit-info`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Client Info
            </Link>
          </Button>
          <Button variant="default" asChild>
            <Link to={`/admin/clients/${clientId}/widget-settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Widget Settings
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <ClientInfoCard 
            client={client} 
            chatHistory={chatHistory} 
            aiAgentStats={agentStats} 
          />

          <QueryList 
            queries={commonQueries} 
            isLoading={isLoadingCommonQueries} 
          />

          <ErrorLogList 
            logs={errorLogs} 
            isLoading={isLoadingErrorLogs} 
          />
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Chat History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingChatHistory ? (
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Chat History</h3>
                  <p className="text-muted-foreground">
                    This client hasn't had any chat interactions yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.slice(0, 5).map((chat: ChatInteraction) => (
                    <div key={chat.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-medium">{chat.query_text}</div>
                        <div className="text-xs text-muted-foreground">
                          {chat.created_at ? formatDate(chat.created_at) : 'Unknown date'}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {chat.response && chat.response.length > 200
                          ? `${chat.response.substring(0, 200)}...`
                          : chat.response}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            {chatHistory.length > 0 && (
              <CardFooter>
                <Button variant="outline" size="sm" className="ml-auto">
                  View All History
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientView;
