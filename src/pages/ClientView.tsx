
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Globe, 
  FileText, 
  Settings, 
  PlusCircle, 
  History,
  Edit,
  User,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientStats } from '@/components/client/ClientStats';
import { execSql } from '@/utils/rpcUtils';
import { useClientChatHistory } from '@/hooks/useClientChatHistory';
import { ChatInteraction } from '@/types/agent';
import { formatDate } from '@/utils/stringUtils';
import { useClientActivity } from '@/hooks/useClientActivity';
import { useRecentActivities } from '@/hooks/useRecentActivities';

const ClientView = () => {
  const { clientId = '' } = useParams();
  const [clientData, setClientData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { chatHistory, isLoading: isLoadingChatHistory } = useClientChatHistory(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  const { data: activitiesData, isLoading: isLoadingActivities } = useRecentActivities();
  const activities = activitiesData || [];

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientId) return;
      
      try {
        setIsLoading(true);
        
        const query = `
          SELECT * FROM ai_agents 
          WHERE id = '${clientId}' 
          LIMIT 1
        `;
        
        const result = await execSql(query);
        
        if (result && Array.isArray(result) && result.length > 0) {
          setClientData(result[0]);
        }
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClient();
  }, [clientId]);

  if (isLoading) {
    return (
      <div className="container py-12 flex justify-center items-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
        <p className="mb-8">The client you are looking for could not be found.</p>
        <Button asChild>
          <Link to="/admin/clients">Back to Clients</Link>
        </Button>
      </div>
    );
  }

  // Extract client information from settings or direct fields
  const settings = clientData.settings || {};
  const clientName = settings.client_name || clientData.client_name || 'Unnamed Client';
  const agentName = clientData.name || settings.agent_name || 'AI Assistant';
  const agentDescription = clientData.agent_description || settings.agent_description || 'No description provided';
  const email = settings.email || clientData.email || 'No email provided';

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <PageHeading>{clientName}</PageHeading>
          <p className="text-muted-foreground">
            Agent: <span className="font-medium">{agentName}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/admin/clients/${clientId}/edit-info`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Client Info
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p>{email}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Created At</h3>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(clientData.created_at)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Updated</h3>
                  <p className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDate(clientData.updated_at)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Chat History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Chat History</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/clients/${clientId}/chat-history`}>
                  <History className="mr-2 h-4 w-4" />
                  View Full History
                </Link>
              </Button>
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
                          {formatDate(chat.created_at)}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {chat.response.length > 200
                          ? `${chat.response.substring(0, 200)}...`
                          : chat.response}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Client Stats */}
          <ClientStats 
            clientId={clientId} 
            agentName={agentName} 
          />

          {/* Widget Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Widget Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <span className="font-medium">Agent Name:</span>
                <div className="mt-1">{agentName}</div>
              </div>
              <div>
                <span className="font-medium">Agent Description:</span>
                <div className="mt-1">
                  {agentDescription}
                </div>
              </div>
              <Separator className="my-4" />
              <Button className="w-full" variant="outline" asChild>
                <Link to={`/admin/clients/${clientId}/widget-settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage Widget Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClientView;
