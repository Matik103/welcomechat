
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ActivityList } from "@/components/dashboard/ActivityList";
import { format, subDays } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, BarChart2, AlertCircle, MessageSquare } from "lucide-react";

const ClientDashboard = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);

  // Get client ID associated with current user
  useEffect(() => {
    const fetchClientInfo = async () => {
      if (!user) return;

      // First try to get client info through user_roles
      try {
        const { data: clientInfo, error } = await supabase
          .from("clients")
          .select("id, client_name, agent_name")
          .eq("email", user.email)
          .maybeSingle();

        if (clientInfo) {
          setClientId(clientInfo.id);
        }
      } catch (error) {
        console.error("Error fetching client info:", error);
      }
    };

    fetchClientInfo();
  }, [user]);

  // Fetch interaction statistics for the chatbot
  const { data: interactionStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["client-interactions", clientId],
    queryFn: async () => {
      if (!clientId) return null;

      // Get last 30 days interactions
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      
      // Get interactions based on agent type
      const { data: clientData } = await supabase
        .from("clients")
        .select("agent_name")
        .eq("id", clientId)
        .single();
      
      if (!clientData?.agent_name) return null;
      
      // Try to get the agent-specific table name
      let agentName = clientData.agent_name.toLowerCase().replace(/\s+/g, '_');
      
      // Fallback to ai_agent table if no specific agent table
      let tableName = 'ai_agent';
      const { data: hasTable } = await supabase.rpc('check_table_exists', { table_name: agentName });
      
      if (hasTable) {
        tableName = agentName;
      }
      
      // Query for interactions in the past 30 days
      const { data: interactions, error } = await supabase.from(tableName)
        .select('*')
        .filter('metadata->type', 'eq', 'chat_interaction')
        .filter('metadata->timestamp', 'gte', thirtyDaysAgo)
        .filter('metadata->client_id', 'eq', clientId);

      if (error) throw error;
      
      // Calculate success rate
      const totalCount = interactions?.length || 0;
      const successCount = interactions?.filter(i => i.metadata?.success)?.length || 0;
      const successRate = totalCount ? Math.round((successCount / totalCount) * 100) : 0;
      
      return {
        total: totalCount,
        successRate: successRate,
        averagePerDay: totalCount > 0 ? Math.round(totalCount / 30) : 0
      };
    },
    enabled: !!clientId,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Fetch common queries asked to the chatbot
  const { data: commonQueries, isLoading: isLoadingQueries } = useQuery({
    queryKey: ["common-queries", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("common_queries")
        .select("*")
        .eq("client_id", clientId)
        .order("frequency", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });

  // Fetch recent error logs
  const { data: errorLogs, isLoading: isLoadingErrors } = useQuery({
    queryKey: ["error-logs", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("error_logs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(5);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });

  // Fetch recent activities
  const { data: activities, isLoading: isLoadingActivities } = useQuery({
    queryKey: ["recent-activities", clientId],
    queryFn: async () => {
      if (!clientId) return [];
      
      const { data, error } = await supabase
        .from("client_activities")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId
  });

  if (!clientId) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-gray-600">Loading client information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant Dashboard</h1>
        <p className="text-gray-500 mb-8">Monitor your AI assistant's performance and user interactions</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard
            title="Total Interactions (30 days)"
            value={interactionStats?.total || 0}
            isLoading={isLoadingStats}
          />
          <MetricCard
            title="Success Rate"
            value={`${interactionStats?.successRate || 0}%`}
            isLoading={isLoadingStats}
          />
          <MetricCard
            title="Daily Average"
            value={interactionStats?.averagePerDay || 0}
            isLoading={isLoadingStats}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">Common User Queries</CardTitle>
                <CardDescription>Questions frequently asked by users</CardDescription>
              </div>
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingQueries ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : commonQueries?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Query</TableHead>
                      <TableHead className="w-[100px] text-right">Frequency</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commonQueries.map((query) => (
                      <TableRow key={query.id}>
                        <TableCell className="font-medium">{query.query_text}</TableCell>
                        <TableCell className="text-right">{query.frequency}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center py-4 text-gray-500">No common queries recorded yet</p>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">Error Logs</CardTitle>
                <CardDescription>Recent issues requiring attention</CardDescription>
              </div>
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingErrors ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : errorLogs?.length ? (
                <div className="space-y-4">
                  {errorLogs.map((log) => (
                    <div key={log.id} className="border-l-4 border-red-500 pl-4 py-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{log.error_type}</p>
                          <p className="text-sm text-gray-600">{log.message}</p>
                        </div>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.created_at!), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">No errors recorded</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <ActivityList 
            activities={activities} 
            isLoading={isLoadingActivities} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
