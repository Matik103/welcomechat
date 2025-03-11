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
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

const ClientView = () => {
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: client, isLoading: isLoadingClient, refetch: refetchClient } = useQuery({
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

  // Use the custom hook for chat history with both required parameters
  const { data: chatHistory, refetch: refetchChatHistory } = useClientChatHistory(client?.agent_name, id);

  // Query common end-user questions
  const { data: commonQueries, refetch: refetchQueries } = useQuery({
    queryKey: ["common-queries", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", id)
        .order("frequency", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Query error logs for chatbot issues
  const { data: errorLogs, refetch: refetchErrorLogs } = useQuery({
    queryKey: ["error-logs", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchClient(),
        refetchChatHistory(),
        refetchQueries(),
        refetchErrorLogs()
      ]);
      toast.success("Dashboard data refreshed");
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.error("Failed to refresh dashboard data");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoadingClient) {
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
        <div className="flex items-center justify-between">
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
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              <>
                <span>Refresh Data</span>
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClientInfoCard client={client} chatHistory={chatHistory} />
          <QueriesCard queries={commonQueries} />
          <ChatHistoryCard chatHistory={chatHistory} />
          <ErrorLogsCard errorLogs={errorLogs} />
        </div>
      </div>
    </div>
  );
};

export default ClientView;
