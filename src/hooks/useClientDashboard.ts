
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useClientDashboard = () => {
  const { user } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [interactionStats, setInteractionStats] = useState<{
    total: number;
    successRate: number;
    averagePerDay: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [commonQueries, setCommonQueries] = useState<any[]>([]);
  const [isLoadingQueries, setIsLoadingQueries] = useState(true);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [isLoadingErrors, setIsLoadingErrors] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);

  useEffect(() => {
    const fetchClientId = async () => {
      if (!user?.id) return;

      try {
        const { data: clientData, error } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (error) {
          console.error("Error fetching client ID:", error);
          return;
        }

        setClientId(clientData?.id || null);
      } catch (error) {
        console.error("Error in fetchClientId:", error);
      }
    };

    fetchClientId();
  }, [user?.id]);

  useEffect(() => {
    if (!clientId) return;

    const fetchStats = async () => {
      setIsLoadingStats(true);
      try {
        // Simulation of fetching interaction stats
        setInteractionStats({
          total: Math.floor(Math.random() * 1000),
          successRate: Math.floor(Math.random() * 100),
          averagePerDay: Math.floor(Math.random() * 50),
        });
      } catch (error) {
        console.error("Error fetching interaction stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    const fetchQueries = async () => {
      setIsLoadingQueries(true);
      try {
        const { data, error } = await supabase
          .from("common_queries")
          .select("*")
          .eq("client_id", clientId)
          .order("frequency", { ascending: false })
          .limit(5);

        if (error) throw error;
        
        setCommonQueries(data.map(item => ({
          ...item,
          // Ensure status is a string if it exists
          status: typeof item.status === 'string' ? item.status : 'active'
        })));
      } catch (error) {
        console.error("Error fetching common queries:", error);
        setCommonQueries([]);
      } finally {
        setIsLoadingQueries(false);
      }
    };

    const fetchErrorLogs = async () => {
      setIsLoadingErrors(true);
      try {
        const { data, error } = await supabase
          .from("error_logs")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setErrorLogs(data);
      } catch (error) {
        console.error("Error fetching error logs:", error);
        setErrorLogs([]);
      } finally {
        setIsLoadingErrors(false);
      }
    };

    const fetchActivities = async () => {
      setIsLoadingActivities(true);
      try {
        // Simulation of fetching activities
        const mockActivities = [
          {
            id: 1,
            type: "user_query",
            message: "How do I reset my password?",
            timestamp: new Date().toISOString(),
          },
          {
            id: 2,
            type: "system_update",
            message: "Chatbot knowledge base updated",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: 3,
            type: "error_resolved",
            message: "Fixed incorrect response issue",
            timestamp: new Date(Date.now() - 172800000).toISOString(),
          },
        ];
        setActivities(mockActivities);
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities([]);
      } finally {
        setIsLoadingActivities(false);
      }
    };

    fetchStats();
    fetchQueries();
    fetchErrorLogs();
    fetchActivities();
  }, [clientId]);

  return {
    clientId,
    interactionStats,
    isLoadingStats,
    commonQueries,
    isLoadingQueries,
    errorLogs,
    isLoadingErrors,
    activities,
    isLoadingActivities,
  };
};
