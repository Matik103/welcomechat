
import { useParams } from 'react-router-dom';
import { ClientMainView } from '@/components/client-view/ClientMainView';
import { ClientNotFound } from '@/components/client-view/ClientNotFound';
import { ClientViewLoading } from '@/components/client-view/ClientViewLoading';
import { useClientViewData } from '@/hooks/useClientViewData';

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

  if (!client) {
    return <ClientNotFound />;
  }

  return (
    <ClientMainView
      client={client}
      clientId={clientId}
      chatHistory={chatHistory}
      commonQueries={commonQueries}
      errorLogs={errorLogs}
      isLoadingErrorLogs={isLoadingErrorLogs}
      isLoadingCommonQueries={isLoadingCommonQueries}
      isLoadingChatHistory={isLoadingChatHistory}
      aiAgentStats={agentStats}
    />
  );
};

export default ClientView;
