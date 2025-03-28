
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Edit, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { Client } from '@/types/client';
import { ClientInfoCard } from '@/components/client-view/ClientInfoCard';
import { QueryList } from '@/components/client-dashboard/QueryList';
import { ErrorLogList } from '@/components/client-dashboard/ErrorLogList';
import { ChatHistoryCard } from '@/components/client-view/ChatHistoryCard';
import { useNavigation } from '@/hooks/useNavigation';

interface ClientMainViewProps {
  client: Client;
  clientId: string;
  chatHistory: any[];
  commonQueries: any[];
  errorLogs: any[];
  isLoadingErrorLogs: boolean;
  isLoadingCommonQueries: boolean;
  isLoadingChatHistory: boolean;
  aiAgentStats: {
    total_interactions: number;
    active_days: number;
    average_response_time: number;
    success_rate: number;
  };
}

export const ClientMainView: React.FC<ClientMainViewProps> = ({
  client,
  clientId,
  chatHistory,
  commonQueries,
  errorLogs,
  isLoadingErrorLogs,
  isLoadingCommonQueries,
  isLoadingChatHistory,
  aiAgentStats
}) => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

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
            aiAgentStats={aiAgentStats} 
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
          <ChatHistoryCard 
            chatHistory={chatHistory} 
            isLoading={isLoadingChatHistory} 
          />
        </div>
      </div>
    </div>
  );
};
