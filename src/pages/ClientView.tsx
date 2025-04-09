
import { useParams } from 'react-router-dom';
import { ClientMainView } from '@/components/client-view/ClientMainView';
import { ClientNotFound } from '@/components/client-view/ClientNotFound';
import { ClientViewLoading } from '@/components/client-view/ClientViewLoading';
import { useClientViewData } from '@/hooks/useClientViewData';
import { useEffect } from 'react';
import { toast } from 'sonner';

const ClientView = () => {
  const { clientId = '' } = useParams();
  const {
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
  } = useClientViewData(clientId);

  useEffect(() => {
    // Show client loading toast
    if (isLoadingClient) {
      toast.info('Loading client data...', { id: 'loading-client' });
    } else {
      toast.dismiss('loading-client');
    }
  }, [isLoadingClient]);

  if (!clientId) {
    return (
      <ClientNotFound 
        message="No client ID was provided." 
      />
    );
  }

  if (isLoadingClient) {
    return <ClientViewLoading />;
  }

  if (clientError || !client) {
    return <ClientNotFound message={clientError?.message} />;
  }

  return (
    <ClientMainView
      client={client}
      clientId={clientId}
      chatHistory={chatHistory || []}
      commonQueries={commonQueries || []}
      errorLogs={errorLogs || []}
      isLoadingErrorLogs={isLoadingErrorLogs}
      isLoadingCommonQueries={isLoadingCommonQueries}
      isLoadingChatHistory={isLoadingChatHistory}
      aiAgentStats={agentStats}
    />
  );
};

export default ClientView;
