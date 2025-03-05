
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientDashboard } from "@/hooks/useClientDashboard";
import { InteractionStats } from "@/components/client-dashboard/InteractionStats";
import { QueryList } from "@/components/client-dashboard/QueryList";
import { ErrorLogList } from "@/components/client-dashboard/ErrorLogList";
import { useClientActivity } from "@/hooks/useClientActivity";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ClientDashboard = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { stats, errorLogs, queries, isLoadingErrorLogs, isLoadingQueries, isLoadingStats } = useClientDashboard(clientId);
  const { logClientActivity } = useClientActivity(clientId);
  const [aiAgentName, setAiAgentName] = useState<string>("");
  const [isLoadingClient, setIsLoadingClient] = useState(true);
  
  // Log dashboard visit activity when component mounts
  useEffect(() => {
    if (clientId) {
      logClientActivity(
        "dashboard_visited", 
        "visited their dashboard", 
        { timestamp: new Date().toISOString() }
      );
    }
  }, [clientId, logClientActivity]);

  // Fetch AI agent name from client table
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) return;
      
      setIsLoadingClient(true);
      
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("agent_name, widget_settings")
          .eq("id", clientId)
          .single();
        
        if (error) {
          console.error("Error fetching client data:", error);
          return;
        }
        
        if (data) {
          console.log("Client data fetched:", data);
          setAiAgentName(data.agent_name || "");
        }
      } catch (err) {
        console.error("Error in fetchClientData:", err);
      } finally {
        setIsLoadingClient(false);
      }
    };
    
    fetchClientData();
    
    // Set up realtime subscription for client data changes
    const channel = supabase
      .channel('client-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${clientId}`
        },
        () => {
          fetchClientData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const isLoading = isLoadingClient || isLoadingStats || (isLoadingErrorLogs && isLoadingQueries) || !clientId;
  
  console.log("Dashboard loading state:", { 
    isLoadingClient, 
    isLoadingStats, 
    isLoadingErrorLogs, 
    isLoadingQueries, 
    clientId,
    stats
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-sm text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Your Chatbot Dashboard</h1>
          <p className="text-gray-500">
            {aiAgentName ? 
              `Monitor your "${aiAgentName}" AI assistant's performance` : 
              "Monitor your AI chatbot's performance"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <InteractionStats stats={stats} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <QueryList queries={queries} isLoading={isLoadingQueries} />
          <ErrorLogList logs={errorLogs} isLoading={isLoadingErrorLogs} />
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
