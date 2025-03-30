import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { ClientFormData } from "@/types/client-form";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";

export const useClientData = (id: string | undefined) => {
  const { user, userRole } = useAuth();
  
  // For client users, always use their metadata client_id
  let clientId = id;
  if (userRole === 'client' && user?.user_metadata?.client_id) {
    clientId = user.user_metadata.client_id;
    console.log("Using client_id from user metadata:", clientId);
  }
  
  // Get client data with staleTime to prevent excessive refetching
  const { 
    client, 
    isLoading, 
    error,
    refetch
  } = useClient(clientId || '', {
    staleTime: 0, // No stale time to ensure fresh data
    cacheTime: 60000,  // 1 minute
    retry: 3,
    enabled: Boolean(clientId),
    refetchOnWindowFocus: true, // This will refetch when the window regains focus
  });
  
  // Log errors for debugging purposes
  useEffect(() => {
    if (error) {
      console.error("Error in useClientData hook:", error);
      console.log("Current user role:", userRole);
      console.log("User metadata:", user?.user_metadata);
      console.log(`Attempted to fetch client with ID: ${clientId}`);
      
      // Show error toast for client users
      if (userRole === 'client') {
        toast.error("Unable to load your client information. Please try refreshing the page.");
      }
    }
  }, [error, clientId, user?.user_metadata, userRole]);
  
  // Log client data for debugging
  useEffect(() => {
    if (client) {
      console.log("Client data loaded:", client);
    } else if (!isLoading && !error) {
      console.log("No client data found with ID:", clientId);
      if (userRole === 'client') {
        toast.error("Unable to find your client information. Please contact support.");
      }
    }
  }, [client, isLoading, clientId, error, userRole]);
  
  const clientMutation = useClientMutation();

  // Memoized refetch function to avoid unnecessary re-renders
  const refetchClient = useCallback(() => {
    if (clientId) {
      console.log("Refetching client data for:", clientId);
      return refetch();
    }
    return Promise.resolve();
  }, [clientId, refetch]);

  // Get the effective client ID (either client.id or client.client_id)
  const effectiveClientId = client?.id || client?.client_id || clientId;

  return {
    client,
    isLoadingClient: isLoading,
    error,
    clientMutation,
    clientId: effectiveClientId,
    refetchClient
  };
};
