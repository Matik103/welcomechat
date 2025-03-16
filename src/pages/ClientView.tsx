
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ClientView = () => {
  const { id } = useParams();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<{
    lastMigrated: string | null;
    count: number | null;
  }>({ lastMigrated: null, count: null });

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

  // Check migration status on load
  useEffect(() => {
    if (client?.agent_name && id) {
      checkMigrationStatus();
    }
  }, [client, id]);

  // Function to check AI agent migration status
  const checkMigrationStatus = async () => {
    if (!client?.agent_name || !id) return;
    
    try {
      // Count AI agent entries for this client
      const { count, error } = await supabase
        .from("ai_agents")
        .select("*", { count: 'exact', head: true })
        .eq("client_id", id);
        
      if (error) {
        console.error("Error checking migration status:", error);
        return;
      }

      // Get the last migration activity
      const { data: lastActivity } = await supabase
        .from("client_activities")
        .select("created_at")
        .eq("client_id", id)
        .eq("activity_type", "ai_agent_created")
        .order("created_at", { ascending: false })
        .limit(1);
        
      setMigrationStatus({
        count: count,
        lastMigrated: lastActivity && lastActivity.length > 0 ? 
          lastActivity[0].created_at : null
      });
    } catch (error) {
      console.error("Error checking migration status:", error);
    }
  };

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
        // If no new records were migrated, let's run a manual SQL query to ensure data is connected
        const { data: manualConnectData, error: manualConnectError } = await supabase.rpc(
          'exec_sql',
          {
            sql_query: `
              -- Update any ai_agents entries that match this client's agent name
              UPDATE ai_agents
              SET client_id = '${id}'
              WHERE name = '${client.agent_name}'
              AND (client_id IS NULL OR client_id != '${id}')
              RETURNING id;
            `
          }
        );
        
        if (manualConnectError) {
          console.error("Manual connection failed:", manualConnectError);
          toast.warning("No new records to migrate, manual connection attempt failed");
        } else {
          let connectedCount = 0;
          if (Array.isArray(manualConnectData) && manualConnectData.length > 0) {
            connectedCount = manualConnectData.length;
          }
          
          if (connectedCount > 0) {
            toast.success(`Manually connected ${connectedCount} existing records to this client`);
          } else {
            toast.info("No records needed migration or connection");
          }
        }
      }
      
      await Promise.all([
        refetchClient(),
        refetchChatHistory(),
        refetchQueries(),
        refetchErrorLogs()
      ]);
      
      // Update migration status after changes
      checkMigrationStatus();
      
    } catch (error) {
      console.error("Error in verify migration:", error);
      toast.error("Migration verification failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Run a full migration via exec_sql
  const runFullMigration = async () => {
    try {
      setIsRefreshing(true);
      
      if (!client?.agent_name) {
        toast.error("Client has no agent name defined");
        return;
      }
      
      toast.info("Running full migration process...");
      
      // Execute the migration function from 20240911_fix_ai_agents_migration.sql
      const { data, error } = await supabase.rpc(
        'exec_sql',
        {
          sql_query: `
            -- Create a temporary function to run the migration for a specific client
            CREATE OR REPLACE FUNCTION temp_run_full_migration(client_id_param uuid, agent_name_param text)
            RETURNS text
            LANGUAGE plpgsql
            AS $$
            DECLARE
              migration_count integer;
              source_table text := agent_name_param;
              result text;
            BEGIN
              -- Try to migrate from source table
              SELECT migrate_chatbot_to_ai_agents(
                source_table, 
                client_id_param, 
                agent_name_param
              ) INTO migration_count;
              
              result := migration_count || ' records migrated from ' || source_table;
              
              -- Create client activity record
              INSERT INTO client_activities (
                client_id,
                activity_type,
                description,
                metadata
              ) VALUES (
                client_id_param,
                'ai_agent_created',
                'Migration executed from dashboard: ' || migration_count || ' entries',
                jsonb_build_object(
                  'agent_name', agent_name_param,
                  'source_table', source_table,
                  'record_count', migration_count,
                  'execution_type', 'manual'
                )
              );
              
              RETURN result;
            END;
            $$;
            
            -- Run the migration for this specific client
            SELECT temp_run_full_migration('${id}', '${client.agent_name}');
            
            -- Clean up
            DROP FUNCTION temp_run_full_migration;
          `
        }
      );
      
      if (error) {
        console.error("Full migration failed:", error);
        toast.error("Full migration failed: " + error.message);
        return;
      }
      
      toast.success("Full migration completed successfully!");
      
      // Refresh all data
      await Promise.all([
        refetchClient(),
        refetchChatHistory(),
        refetchQueries(),
        refetchErrorLogs()
      ]);
      
      // Update migration status
      checkMigrationStatus();
      
    } catch (error) {
      console.error("Error in full migration:", error);
      toast.error("Full migration failed");
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
      checkMigrationStatus();
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
              onClick={runFullMigration}
              disabled={isRefreshing}
              className="flex items-center gap-1 bg-amber-50 hover:bg-amber-100"
            >
              {isRefreshing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <span>Run Full Migration</span>
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
                <p><strong>AI Agent Entries:</strong> {migrationStatus.count !== null ? migrationStatus.count : (debug.count !== null ? debug.count : 'Checking...')}</p>
                <p><strong>Chat History Entries:</strong> {chatHistory.length}</p>
                {migrationStatus.lastMigrated && (
                  <p><strong>Last Migration:</strong> {new Date(migrationStatus.lastMigrated).toLocaleString()}</p>
                )}
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
