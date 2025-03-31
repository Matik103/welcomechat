
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
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
  
  // Log detailed information for debugging
  useEffect(() => {
    console.log("useClientData hook initialized with ID:", id);
    console.log("User role:", userRole);
    console.log("User metadata:", user?.user_metadata);
    console.log("Using clientId:", clientId);
  }, [id, user, userRole, clientId]);
  
  // Get client data with no staleTime to ensure fresh data every time
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
      console.log(`Attempted to fetch client with ID: ${clientId}`);
      if (user?.user_metadata?.client_id) {
        console.log(`User metadata contains client_id: ${user.user_metadata.client_id}`);
      }
    }
  }, [error, clientId, user?.user_metadata?.client_id]);
  
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

  // Get the effective client ID (either client.id or client.client_id)
  const effectiveClientId = client?.id || client?.client_id || clientId;

  return {
    client,
    isLoadingClient: isLoading,
    error,
    clientMutation,
    clientId: effectiveClientId, // Return the effective client ID
    refetchClient
  };
};
