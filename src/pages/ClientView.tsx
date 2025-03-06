
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Import custom components
import { ClientInfoCard } from "@/components/client-view/ClientInfoCard";
import { QueriesCard } from "@/components/client-view/QueriesCard";
import { ChatHistoryCard } from "@/components/client-view/ChatHistoryCard";
import { ErrorLogsCard } from "@/components/client-view/ErrorLogsCard";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";
import { fetchDashboardStats } from "@/services/statsService";
import { fetchErrorLogs } from "@/services/errorLogService";
import { fetchQueries } from "@/services/queryService";

const ClientView = () => {
  const { id } = useParams();

  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Use the custom hook for chat history
  const { data: chatHistory } = useClientChatHistory(client?.agent_name);

  // Query live metrics from AI agent table
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["dashboard-stats", id],
    queryFn: async () => {
      if (!id) return null;
      return await fetchDashboardStats(id);
    },
    enabled: !!id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Query common end-user questions from AI agent table
  const { data: commonQueries, isLoading: isLoadingQueries } = useQuery({
    queryKey: ["common-queries", id],
    queryFn: async () => {
      if (!id) return [];
      return await fetchQueries(id);
    },
    enabled: !!id,
    refetchInterval: 30000,
  });

  // Query error logs for chatbot issues
  const { data: errorLogs, isLoading: isLoadingErrorLogs } = useQuery({
    queryKey: ["error-logs", id],
    queryFn: async () => {
      if (!id) return [];
      return await fetchErrorLogs(id);
    },
    enabled: !!id,
    refetchInterval: 30000,
  });

  if (isLoadingClient || isLoadingStats) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900">Client not found</h1>
          <Link 
            to="/clients"
            className="text-primary hover:underline mt-4 inline-block"
          >
            Return to client list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Link 
            to="/clients"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.client_name}</h1>
            <p className="text-gray-500">AI Agent Performance Dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClientInfoCard 
            client={client} 
            chatHistory={chatHistory}
            stats={dashboardStats}
            isLoadingStats={isLoadingStats}
          />
          <QueriesCard 
            queries={commonQueries} 
            isLoading={isLoadingQueries}
          />
          <ChatHistoryCard 
            chatHistory={chatHistory} 
          />
          <ErrorLogsCard 
            errorLogs={errorLogs}
            isLoading={isLoadingErrorLogs}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientView;
