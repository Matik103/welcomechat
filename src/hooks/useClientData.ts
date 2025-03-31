
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { ClientFormData } from "@/types/client-form";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";

export const useClientData = (id: string | undefined) => {
  const { user, userRole } = useAuth();
  const lastFetchRef = useRef<number>(0);
  
  // Determine the appropriate clientId to use
  // Try the explicitly provided ID first, then fall back to user metadata
  let clientId = id;
  if (!clientId && userRole === 'client' && user?.user_metadata?.client_id) {
    clientId = user.user_metadata.client_id;
  }
  
  // Get client data with optimized fetch settings
  const { 
    client, 
    isLoading, 
    error,
    refetch
  } = useClient(clientId || '', {
    staleTime: 300000, // 5 minutes
    cacheTime: 600000,  // 10 minutes
    retry: 3,
    enabled: Boolean(clientId),
    refetchOnWindowFocus: false, // Prevent automatic refetches on window focus
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
  
  const clientMutation = useClientMutation();

  // Memoized refetch function to avoid unnecessary re-renders
  // Also adds a debounce mechanism to prevent excessive refetches
  const refetchClient = useCallback(() => {
    if (clientId) {
      const now = Date.now();
      // Only refetch if more than 2 seconds have passed since the last fetch
      if (now - lastFetchRef.current > 2000) {
        lastFetchRef.current = now;
        console.log("Refetching client data for:", clientId);
        return refetch();
      } else {
        console.log("Skipping refetch - too soon since last fetch");
      }
    }
    return Promise.resolve();
  }, [clientId, refetch]);

  // Get the effective client ID from different possible sources
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
