
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
    average_response_time: 0
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
        
        // Fixed query to avoid using MIN on UUID which was causing errors
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
        
        // Fixed query to avoid using MIN on UUID which was causing errors
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
            get_agent_dashboard_stats('${clientId}', '${client.agent_name}')
        `;
        
        const result = await execSql(query);
        
        if (result && Array.isArray(result) && result.length > 0) {
          const stats = result[0].get_agent_dashboard_stats;
          if (stats) {
            setAgentStats(stats);
          }
        }
      } catch (error) {
        console.error('Error fetching agent stats:', error);
      }
    };
    
    // Only fetch data if we have a clientId
    if (clientId) {
      fetchErrorLogs();
      fetchCommonQueries();
    }

    // Fetch agent stats when client data is available
    if (clientId && client) {
      fetchAgentStats();
    }
  }, [clientId, client]);

  // Set up real-time subscription for AI agent updates
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
          // Refetch data when changes occur
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

  // Safety check - if we're loading or don't have a clientId, return a loading state
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

  // Use real values from the API response, with fallbacks only if needed
  const clientName = client.client_name || 'Client';
  const agentName = client.agent_name || client.name || 'AI Assistant';
  const agentDescription = client.description || 'No description provided';

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
          <PageHeading>{clientName}</PageHeading>
          <p className="text-muted-foreground">
            <span className="font-medium">{agentName}</span>
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
        {/* Main content area - 8 columns */}
        <div className="lg:col-span-8 space-y-6">
          {/* Client Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <User className="h-4 w-4" /> Client Name
                  </h3>
                  <p className="font-semibold">{clientName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Bot className="h-4 w-4" /> AI Agent Name
                  </h3>
                  <p className="font-semibold">{agentName}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Agent Description
                </h3>
                <p className="mt-1">{agentDescription}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {client.created_at ? formatDate(client.created_at) : 'Unknown'}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {client.updated_at ? formatDate(client.updated_at) : 'Unknown'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Queries Card */}
          <QueryList 
            queries={commonQueries} 
            isLoading={isLoadingCommonQueries} 
          />

          {/* Recent Chat History */}
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

        {/* Sidebar - 4 columns */}
        <div className="lg:col-span-4 space-y-6">
          {/* Activity Card */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last active:</span>
                  <span className="font-medium">
                    {client.last_active ? formatDate(client.last_active) : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={`font-medium ${client.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                    {client.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              
              {/* Performance metrics in the sidebar */}
              <div className="mt-6 space-y-4">
                <h3 className="font-medium">Performance Metrics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 font-medium">Interactions</p>
                    <p className="text-xl font-bold">{agentStats.total_interactions || 0}</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 font-medium">Active Days</p>
                    <p className="text-xl font-bold">{agentStats.active_days || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-purple-600 font-medium">Avg Response</p>
                    <p className="text-xl font-bold">{agentStats.average_response_time ? agentStats.average_response_time.toFixed(2) + 's' : '0s'}</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-xs text-yellow-600 font-medium">Success Rate</p>
                    <p className="text-xl font-bold">100%</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Logs Card */}
          <ErrorLogList 
            logs={errorLogs} 
            isLoading={isLoadingErrorLogs} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientView;
