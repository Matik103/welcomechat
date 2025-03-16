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

  // Fetch client data with complete information including widget_settings
  const { data: client, isLoading: isLoadingClient, refetch: refetchClient } = useQuery({
    queryKey: ["client", id, "detailed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select(`
          *,
          website_urls(*),
          google_drive_links(*)
        `)
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

  // Fetch AI agent statistics
  const { data: aiAgentStats, refetch: refetchAiAgentStats } = useQuery({
    queryKey: ["ai-agent-stats", id, client?.agent_name],
    queryFn: async () => {
      if (!id || !client?.agent_name) {
        return null;
      }
      
      try {
        const { data, error } = await supabase.rpc(
          'get_agent_dashboard_stats',
          {
            client_id_param: id,
            agent_name_param: client.agent_name
          }
        );
        
        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error fetching AI agent stats:", error);
        return null;
      }
    },
    enabled: !!(id && client?.agent_name),
  });

  // Fetch recent client activities
  const { data: recentActivities, refetch: refetchActivities } = useQuery({
    queryKey: ["client-activities", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", id)
        .order("created_at", { ascending: false })
        .limit(10);
        
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
        .from('ai_agents')
        .select('*', { count: 'exact', head: true })
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
      
      // If no entries found, check if the source table exists
      if (count === 0) {
        console.log("No AI agent entries found, checking source tables...");
        checkSourceTables();
      }
    } catch (error) {
      console.error("Error checking migration status:", error);
    }
  };
  
  // Function to check if source tables exist
  const checkSourceTables = async () => {
    if (!client?.agent_name) return;
    
    try {
      // Check if the original chatbot table exists
      const { data, error } = await supabase.rpc(
        'exec_sql',
        {
          sql_query: `
            SELECT EXISTS (
              SELECT FROM pg_tables 
              WHERE schemaname = 'public' 
              AND tablename = '${client.agent_name}'
            ) as exists
          `
        }
      );
      
      const tableExists = Array.isArray(data) && 
                        data.length > 0 && 
                        typeof data[0] === 'object' && 
                        data[0] !== null &&
                        'exists' in data[0] && 
                        data[0].exists === true;
      
      if (tableExists) {
        console.log(`Source table ${client.agent_name} exists, can be migrated`);
      } else {
        console.log(`Source table ${client.agent_name} does not exist`);
        
        // Check for similar table names
        const { data: similarTables, error: similarError } = await supabase.rpc(
          'exec_sql',
          {
            sql_query: `
              SELECT tablename 
              FROM pg_tables 
              WHERE schemaname = 'public' 
              AND (
                tablename LIKE '%${client.agent_name}%' OR 
                '${client.agent_name}' LIKE '%' || tablename || '%'
              )
            `
          }
        );
        
        if (!similarError && Array.isArray(similarTables) && similarTables.length > 0) {
          console.log("Found similar tables:", similarTables);
        }
      }
    } catch (error) {
      console.error("Error checking source tables:", error);
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
      
      // Check possible source tables
      const potentialSources = [
        client.agent_name,
        client.agent_name.toLowerCase(),
        client.agent_name.replace(/\s+/g, '_').toLowerCase()
      ];
      
      let migratedCount = 0;
      
      // Try each potential source table
      for (const sourceName of potentialSources) {
        console.log(`Attempting migration from source: ${sourceName}`);
        
        // Run the migration function for this source
        const { data, error } = await supabase.rpc(
          'exec_sql',
          {
            sql_query: `
              SELECT migrate_chatbot_to_ai_agents(
                '${sourceName}', 
                '${id}', 
                '${client.agent_name}'
              ) as migrated_count;
            `
          }
        );
        
        if (error) {
          console.error(`Migration from ${sourceName} failed:`, error);
          continue;
        }
        
        // Parse the migrated count
        if (Array.isArray(data) && data.length > 0) {
          const row = data[0];
          if (typeof row === 'object' && row !== null && 'migrated_count' in row) {
            const count = Number(row.migrated_count);
            console.log(`Migrated ${count} records from ${sourceName}`);
            migratedCount += count;
            
            if (count > 0) break; // Stop if we found a valid source
          }
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
            // Last resort: create at least one entry
            const { error: createError } = await supabase
              .from("ai_agents")
              .insert({
                client_id: id,
                name: client.agent_name,
                content: `Initial entry for ${client.client_name}`,
                interaction_type: 'initial_setup',
                settings: {
                  source: 'manual_setup',
                  client_name: client.client_name,
                  creation_date: new Date().toISOString()
                }
              });
              
            if (createError) {
              toast.error("Failed to create initial entry");
            } else {
              toast.info("Created initial AI agent entry for this client");
            }
          }
        }
      }
      
      await Promise.all([
        refetchClient(),
        refetchChatHistory(),
        refetchQueries(),
        refetchErrorLogs(),
        refetchAiAgentStats(),
        refetchActivities()
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
      
      // First, try direct migration to see if the exact agent_name table exists
      const { data: directMigrationData, error: directMigrationError } = await supabase.rpc(
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
      
      // Extract migrated count
      let directMigrationCount = 0;
      if (!directMigrationError && Array.isArray(directMigrationData) && directMigrationData.length > 0) {
        const row = directMigrationData[0];
        if (typeof row === 'object' && row !== null && 'migrated_count' in row) {
          directMigrationCount = Number(row.migrated_count);
        }
      }
      
      if (directMigrationCount > 0) {
        toast.success(`Directly migrated ${directMigrationCount} records from ${client.agent_name}`);
      } else {
        // Try with alternate table names - lowercase, underscores instead of spaces, etc.
        const alternateNames = [
          client.agent_name.toLowerCase(),
          client.agent_name.replace(/\s+/g, '_'),
          client.agent_name.replace(/\s+/g, '_').toLowerCase()
        ];
        
        let alternateMigrationCount = 0;
        for (const alternateName of alternateNames) {
          if (alternateName === client.agent_name) continue; // Skip if it's the same as the original
          
          const { data: altData, error: altError } = await supabase.rpc(
            'exec_sql',
            {
              sql_query: `
                SELECT migrate_chatbot_to_ai_agents(
                  '${alternateName}', 
                  '${id}', 
                  '${client.agent_name}'
                ) as migrated_count;
              `
            }
          );
          
          if (!altError && Array.isArray(altData) && altData.length > 0) {
            const row = altData[0];
            if (typeof row === 'object' && row !== null && 'migrated_count' in row) {
              const count = Number(row.migrated_count);
              if (count > 0) {
                alternateMigrationCount += count;
                console.log(`Migrated ${count} records from alternate name ${alternateName}`);
              }
            }
          }
        }
        
        if (alternateMigrationCount > 0) {
          toast.success(`Migrated ${alternateMigrationCount} records from alternate table names`);
        } else {
          // Try to find any existing records with similar names and link them
          const { data: linkResults, error: linkError } = await supabase.rpc(
            'exec_sql',
            {
              sql_query: `
                UPDATE ai_agents
                SET client_id = '${id}'
                WHERE 
                  (name LIKE '%${client.agent_name}%' OR
                   '${client.agent_name}' LIKE '%' || name || '%')
                  AND (client_id IS NULL OR client_id != '${id}')
                RETURNING id
              `
            }
          );
          
          let linkedCount = 0;
          if (!linkError && Array.isArray(linkResults)) {
            linkedCount = linkResults.length;
          }
          
          if (linkedCount > 0) {
            toast.success(`Linked ${linkedCount} existing records to this client`);
          } else {
            toast.info("No source tables found for migration");
          }
        }
      }
      
      // Insert at least one record if none exist
      const { count, error: countError } = await supabase
        .from("ai_agents")
        .select("*", { count: 'exact', head: true })
        .eq("client_id", id);
        
      if (!countError && count === 0) {
        const { error: insertError } = await supabase
          .from("ai_agents")
          .insert({
            client_id: id,
            name: client.agent_name,
            content: `Initial entry for ${client.client_name}`,
            interaction_type: 'initial_setup',
            settings: {
              source: 'manual_setup',
              client_name: client.client_name,
              creation_date: new Date().toISOString()
            }
          });
          
        if (insertError) {
          console.error("Error creating initial entry:", insertError);
        } else {
          toast.success("Created initial AI agent entry");
        }
      }
      
      // Record the migration activity
      await supabase.from("client_activities").insert({
        client_id: id,
        activity_type: 'ai_agent_created',
        description: 'Migration executed from dashboard',
        metadata: {
          agent_name: client.agent_name,
          execution_type: 'manual',
          timestamp: new Date().toISOString()
        }
      });
      
      // Refresh all data
      await Promise.all([
        refetchClient(),
        refetchChatHistory(),
        refetchQueries(),
        refetchErrorLogs(),
        refetchAiAgentStats(),
        refetchActivities()
      ]);
      
      // Update migration status
      checkMigrationStatus();
      
      toast.success("Migration completed successfully!");
      
    } catch (error) {
      console.error("Error in full migration:", error);
      toast.error("Full migration failed");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle refresh - updated to fetch all data sources
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchClient(),
        refetchChatHistory(),
        refetchQueries(),
        refetchErrorLogs(),
        refetchAiAgentStats(),
        refetchActivities()
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
            
            <Link to={`/admin/clients/${id}/edit`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                Edit Client
              </Button>
            </Link>
            
            <Link to={`/admin/clients/${id}/widget-settings`}>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                Widget Settings
              </Button>
            </Link>
            
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
                <p><strong>Website URLs:</strong> {client.website_urls?.length || 0}</p>
                <p><strong>Google Drive Links:</strong> {client.google_drive_links?.length || 0}</p>
                {client.widget_settings && (
                  <p><strong>Widget Settings:</strong> Configured</p>
                )}
                {migrationStatus.lastMigrated && (
                  <p><strong>Last Migration:</strong> {new Date(migrationStatus.lastMigrated).toLocaleString()}</p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClientInfoCard client={client} chatHistory={chatHistory} aiAgentStats={aiAgentStats} />
          <QueriesCard queries={commonQueries} />
          <ChatHistoryCard chatHistory={chatHistory} />
          <ErrorLogsCard errorLogs={errorLogs} />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-2">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="p-3 bg-gray-50 rounded-md border border-gray-100">
                    <div className="flex justify-between">
                      <span className="font-medium">{activity.activity_type.replace(/_/g, ' ')}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-1">{activity.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No recent activities found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientView;
