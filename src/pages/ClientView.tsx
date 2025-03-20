import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Calendar, 
  Clock, 
  Globe, 
  FileText, 
  Trash2, 
  Settings, 
  PlusCircle, 
  History,
  Edit 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ExecutionStatus } from '@/components/client/ExecutionStatus';
import { ClientStats } from '@/components/client/ClientStats';
import { ClientDetails } from '@/components/client/ClientDetails';
import { ClientActivity } from '@/components/client/ClientActivity';
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
  const { chatHistory, isLoading: isLoadingChatHistory, debug } = useClientChatHistory(clientId);
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

  const [websiteUrls, setWebsiteUrls] = useState<any[]>([]);
  const [documentLinks, setDocumentLinks] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchResources = async () => {
      if (!clientId) return;
      
      try {
        const websiteUrlsQuery = `
          SELECT * FROM website_urls 
          WHERE client_id = '${clientId}' 
          ORDER BY created_at DESC
        `;
        
        const websiteUrlsResult = await execSql(websiteUrlsQuery);
        if (websiteUrlsResult && Array.isArray(websiteUrlsResult)) {
          setWebsiteUrls(websiteUrlsResult);
        }
        
        const documentLinksQuery = `
          SELECT * FROM document_links 
          WHERE client_id = '${clientId}' 
          ORDER BY created_at DESC
        `;
        
        const documentLinksResult = await execSql(documentLinksQuery);
        if (documentLinksResult && Array.isArray(documentLinksResult)) {
          setDocumentLinks(documentLinksResult);
        }
      } catch (error) {
        console.error('Error fetching resources:', error);
      }
    };
    
    fetchResources();
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

  const clientName = clientData.client_name || 'Unnamed Client';
  const agentName = clientData.name || 'AI Assistant';

  const totalWebsiteUrls = websiteUrls.length;
  const totalDocumentLinks = documentLinks.length;

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
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <ClientDetails 
                client={clientData} 
                clientId={clientId} 
                isClientView={false}
                logClientActivity={logClientActivity}
              />
            </CardContent>
          </Card>

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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Resources</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/clients/${clientId}/resources`}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Manage Resources
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <Globe className="mr-2 h-4 w-4" />
                    Website URLs
                  </h3>
                  {totalWebsiteUrls === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No website URLs added yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {websiteUrls.slice(0, 3).map((url) => (
                        <div key={url.id} className="flex justify-between items-center">
                          <a
                            href={url.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {url.url.length > 40
                              ? `${url.url.substring(0, 40)}...`
                              : url.url}
                          </a>
                        </div>
                      ))}
                      {totalWebsiteUrls > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{totalWebsiteUrls - 3} more URLs
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-medium flex items-center mb-2">
                    <FileText className="mr-2 h-4 w-4" />
                    Document Links
                  </h3>
                  {totalDocumentLinks === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No document links added yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {documentLinks.slice(0, 3).map((link) => (
                        <div key={link.id} className="flex justify-between items-center">
                          <a
                            href={link.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {link.link.length > 40
                              ? `${link.link.substring(0, 40)}...`
                              : link.link}
                          </a>
                          <span className="text-xs capitalize px-2 py-1 bg-gray-100 rounded-full">
                            {link.document_type}
                          </span>
                        </div>
                      ))}
                      {totalDocumentLinks > 3 && (
                        <div className="text-sm text-muted-foreground">
                          +{totalDocumentLinks - 3} more documents
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
            <ClientActivity 
              activities={activities || []} 
              isLoading={isLoadingActivities} 
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <ClientStats 
            clientId={clientId} 
            agentName={agentName} 
          />

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
                  {clientData.agent_description || 'No description set'}
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
