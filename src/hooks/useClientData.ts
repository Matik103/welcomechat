
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
  
  // Enhanced debugging for client ID retrieval
  useEffect(() => {
    console.log("[useClientData] Initialization ==========");
    console.log("Provided ID:", id);
    console.log("User role:", userRole);
    console.log("User object:", user?.id);
    console.log("User metadata:", user?.user_metadata);
    
    // More detailed debugging for user metadata
    if (user?.user_metadata) {
      console.log("User metadata type:", typeof user.user_metadata);
      console.log("User metadata keys:", Object.keys(user.user_metadata));
      console.log("client_id in metadata:", user.user_metadata.client_id);
    } else {
      console.log("No user metadata found");
    }
    
    console.log("Resolved clientId:", clientId);
    console.log("[useClientData] End initialization ==========");
  }, [id, user, userRole, clientId]);
  
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
      console.error("[useClientData] Error fetching client data:", error);
      console.log(`Attempted to fetch client with ID: ${clientId}`);
      
      if (user?.user_metadata?.client_id) {
        console.log(`User metadata contains client_id: ${user.user_metadata.client_id}`);
      } else {
        console.warn("No client_id found in user metadata");
      }
    }
  }, [error, clientId, user?.user_metadata?.client_id]);
  
  // Log client data for debugging
  useEffect(() => {
    if (client) {
      console.log("[useClientData] Client data loaded:", client);
    } else if (!isLoading && clientId) {
      console.warn("[useClientData] No client data found with ID:", clientId);
    }
  }, [client, isLoading, clientId]);
  
  const clientMutation = useClientMutation();

  // Memoized refetch function to avoid unnecessary re-renders
  const refetchClient = useCallback(() => {
    if (clientId) {
      console.log("[useClientData] Refetching client data for:", clientId);
      return refetch();
    }
    console.log("[useClientData] Skipping refetch - no clientId available");
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
