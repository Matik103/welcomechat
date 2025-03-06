
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// Import custom components
import { ClientInfoCard } from "@/components/client-view/ClientInfoCard";
import { QueriesCard } from "@/components/client-view/QueriesCard";
import { ChatHistoryCard } from "@/components/client-view/ChatHistoryCard";
import { ErrorLogsCard } from "@/components/client-view/ErrorLogsCard";
import { useClientChatHistory } from "@/hooks/useClientChatHistory";
import { checkAndRefreshAuth } from "@/services/authService";

const ClientView = () => {
  const { id } = useParams();
  const [isAuthValid, setIsAuthValid] = useState(true);
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Verify authentication
  useEffect(() => {
    const verifyAuth = async () => {
      const isValid = await checkAndRefreshAuth();
      setIsAuthValid(isValid);
      if (!isValid) {
        toast.error("Authentication session expired. Please sign in again.");
      }
    };
    
    verifyAuth();
    
    // Set a timeout to prevent infinite loading
    const timer = setTimeout(() => {
      setLoadTimeout(true);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const { 
    data: client, 
    isLoading: isLoadingClient,
    error: clientError
  } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      try {
        console.log("Fetching client data for ID:", id);
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", id)
          .single();
          
        if (error) {
          console.error("Error fetching client:", error);
          throw error;
        }
        
        console.log("Client data fetched:", data);
        return data;
      } catch (error) {
        console.error("Client fetch error:", error);
        throw error;
      }
    },
    enabled: !!id && isAuthValid,
    retry: 2,
  });

  // Use the custom hook for chat history with better error handling
  const { 
    data: chatHistory,
    isLoading: isLoadingChatHistory,
    error: chatHistoryError
  } = useClientChatHistory(client?.agent_name);

  useEffect(() => {
    if (clientError) {
      console.error("Client data error:", clientError);
      toast.error("Failed to load client data. Please try again.");
    }
    
    if (chatHistoryError) {
      console.error("Chat history error:", chatHistoryError);
      toast.error("Failed to load chat history data.");
    }
  }, [clientError, chatHistoryError]);

  // Query common end-user questions with improved error handling
  const { 
    data: commonQueries,
    isLoading: isLoadingQueries,
    error: queriesError
  } = useQuery({
    queryKey: ["common-queries", id],
    queryFn: async () => {
      try {
        console.log("Fetching common queries for client:", id);
        const { data, error } = await supabase
          .from("common_queries")
          .select("*")
          .eq("client_id", id)
          .order("frequency", { ascending: false })
          .limit(5);
          
        if (error) {
          console.error("Error fetching queries:", error);
          throw error;
        }
        
        console.log("Common queries fetched:", data);
        return data;
      } catch (error) {
        console.error("Queries fetch error:", error);
        throw error;
      }
    },
    enabled: !!id && isAuthValid,
    retry: 2,
  });

  // Query error logs with improved error handling
  const { 
    data: errorLogs,
    isLoading: isLoadingErrorLogs,
    error: errorLogsError
  } = useQuery({
    queryKey: ["error-logs", id],
    queryFn: async () => {
      try {
        console.log("Fetching error logs for client:", id);
        const { data, error } = await supabase
          .from("error_logs")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false })
          .limit(5);
          
        if (error) {
          console.error("Error fetching logs:", error);
          throw error;
        }
        
        console.log("Error logs fetched:", data);
        return data;
      } catch (error) {
        console.error("Error logs fetch error:", error);
        throw error;
      }
    },
    enabled: !!id && isAuthValid,
    retry: 2,
  });

  // Handle all possible loading states
  const isLoading = isLoadingClient || isLoadingChatHistory || isLoadingQueries || isLoadingErrorLogs;
  
  // If still loading and timeout hasn't occurred, show loading state
  if (isLoading && !loadTimeout) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Loading client information...</p>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (!isAuthValid) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-gray-600 mb-4">Your session has expired or you do not have permission to view this page.</p>
          <Link 
            to="/auth"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Handle errors and no client data after loading
  if ((clientError || !client) && loadTimeout) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8">
        <div className="max-w-5xl mx-auto text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Client could not be loaded</h1>
          <p className="text-gray-600 mb-6">
            {clientError 
              ? `Error: ${clientError.message || "Failed to load client data"}`
              : "Client data not found or could not be retrieved."}
          </p>
          <Link 
            to="/clients"
            className="text-primary hover:underline inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
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
            <h1 className="text-2xl font-bold text-gray-900">{client?.client_name || "Client"}</h1>
            <p className="text-gray-500">AI Agent Performance Dashboard</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ClientInfoCard 
            client={client || {agent_name: "", email: ""}} 
            chatHistory={chatHistory} 
          />
          <QueriesCard 
            queries={commonQueries || []} 
          />
          <ChatHistoryCard 
            chatHistory={chatHistory || []} 
          />
          <ErrorLogsCard 
            errorLogs={errorLogs || []} 
          />
        </div>
      </div>
    </div>
  );
};

export default ClientView;
