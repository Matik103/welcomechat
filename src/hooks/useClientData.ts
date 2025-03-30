
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { ClientFormData } from "@/types/client-form";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export const useClientData = (id: string | undefined) => {
  const { user, userRole } = useAuth();
  
  // Determine the appropriate clientId to use
  // Try the explicitly provided ID first, then fall back to user metadata
  let clientId = id;
  if (!clientId && userRole === 'client' && user?.user_metadata?.client_id) {
    clientId = user.user_metadata.client_id;
  }
  
  // Get client data with staleTime to prevent excessive refetching
  const { 
    client, 
    isLoading, 
    error,
    refetch
  } = useClient(clientId || '', {
    staleTime: 1000, // Reduced to 1 second for testing
    cacheTime: 60000,  // 1 minute
    retry: 3,
    enabled: Boolean(clientId),
    refetchOnWindowFocus: true, // This will refetch when the window regains focus
  });
  
  // Log errors for debugging purposes
  useEffect(() => {
    if (error) {
      console.error("Error in useClientData hook:", error);
      if (id) {
        console.log(`Attempted to fetch client with ID: ${id}`);
      }
      if (user?.user_metadata?.client_id) {
        console.log(`User metadata contains client_id: ${user.user_metadata.client_id}`);
      }
    }
  }, [error, id, user?.user_metadata?.client_id]);
  
  // Log client data for debugging
  useEffect(() => {
    if (client) {
      console.log("Client data loaded:", client);
    } else if (!isLoading) {
      console.log("No client data found with ID:", clientId);
    }
  }, [client, isLoading, clientId]);
  
  const clientMutation = useClientMutation();

  // Memoized refetch function to avoid unnecessary re-renders
  const refetchClient = useCallback(() => {
    if (clientId) {
      console.log("Refetching client data for:", clientId);
      return refetch();
    }
    return Promise.resolve();
  }, [clientId, refetch]);

  return {
    client,
    isLoadingClient: isLoading,
    error,
    clientMutation,
    clientId, // Keep the property name as clientId for backward compatibility
    refetchClient
  };
};
