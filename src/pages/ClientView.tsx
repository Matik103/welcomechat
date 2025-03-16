import { ArrowLeft, Loader2, Info } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ClientView = () => {
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

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

  // Use the custom hook for chat history with updated structure
  const { chatHistory, refetchChatHistory, debug } = useClientChatHistory(id);

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

  // Function to verify AI agent migration
  const verifyAgentMigration = async () => {
    try {
      setIsRefreshing(true);
      console.log("Verifying AI agent migration for client:", id);
      
      if (!client?.agent_name) {
        toast.error("Client has no agent name defined");
        return;
      }
      
      // Run the migration function directly
      const { data, error } = await supabase.rpc(
        'exec_sql',
        {
          sql_query: `
            SELECT migrate_chatbot_to_ai_agents(
              '${client.agent_name}', 
              '${id}', 
              '${client.agent_name}'
            ) as migrated_count;
          `
        }
      );
      
      if (error) {
        console.error("Migration verification failed:", error);
        toast.error("Failed to verify migration: " + error.message);
        return;
      }
      
      // Extract the migrated count - fix the TypeScript error by properly handling the response
      let migratedCount = 0;
      
      if (Array.isArray(data) && data.length > 0) {
        // If data is an array and has at least one item
        const firstRow = data[0];
        // Check if the first row is an object with migrated_count property
        if (typeof firstRow === 'object' && firstRow !== null && 'migrated_count' in firstRow) {
          migratedCount = Number(firstRow.migrated_count);
        }
      }
      
      if (migratedCount > 0) {
        toast.success(`Migrated ${migratedCount} records for ${client.agent_name}`);
      } else {
        toast.info("No new records to migrate");
      }
      
      await Promise.all([
        refetchClient(),
        refetchChatHistory(),
        refetchQueries(),
        refetchErrorLogs()
      ]);
      
    } catch (error) {
      console.error("Error in verify migration:", error);
      toast.error("Migration verification failed");
    } finally {
      setIsRefreshing(false);
    }
  };

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
            to="/admin/clients"
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
              to="/admin/clients"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{client.client_name}</h1>
              <p className="text-gray-500">AI Agent Performance Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="flex items-center gap-1"
            >
              <Info className="h-4 w-4" />
              <span>Debug Info</span>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={verifyAgentMigration}
              disabled={isRefreshing}
              className="flex items-center gap-1"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <span>Verify Migration</span>
                </>
              )}
            </Button>
            
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
        </div>

        {showDebugInfo && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Debug Information</AlertTitle>
            <AlertDescription>
              <div className="mt-2 text-sm">
                <p><strong>Client ID:</strong> {id}</p>
                <p><strong>Agent Name:</strong> {client.agent_name || 'Not set'}</p>
                <p><strong>AI Agent Entries:</strong> {debug.count !== null ? debug.count : 'Checking...'}</p>
                <p><strong>Chat History Entries:</strong> {chatHistory.length}</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

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
