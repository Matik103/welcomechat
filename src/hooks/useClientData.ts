
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { isAdminClientConfigured } from "@/integrations/supabase/admin";

export const useClientData = (id: string | undefined) => {
  const { user, userRole } = useAuth();
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  
  // For client users, always use their metadata client_id
  let clientId = id;
  if (userRole === 'client' && user?.user_metadata?.client_id) {
    clientId = user.user_metadata.client_id;
    console.log("Using client_id from user metadata:", clientId);
  }
  
  // Get client data with no stale time to prevent excessive caching
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
  
  // Check if admin client is properly configured
  const adminClientConfigured = isAdminClientConfigured();
  
  // Log errors for debugging purposes
  useEffect(() => {
    if (error) {
      console.error("Error in useClientData hook:", error);
      console.log("Current user role:", userRole);
      console.log("User metadata:", user?.user_metadata);
      console.log(`Attempted to fetch client with ID: ${clientId}`);
      console.log("Admin client configured:", adminClientConfigured);
      
      // Show error toast for client users only once
      if (userRole === 'client' && !initialCheckDone) {
        toast.error("Unable to load your client information. Please try refreshing the page.");
        setInitialCheckDone(true);
      }
    }
  }, [error, clientId, user?.user_metadata, userRole, adminClientConfigured, initialCheckDone]);
  
  // Log client data and admin configuration for debugging
  useEffect(() => {
    if (client) {
      console.log("Client data loaded:", client);
      setInitialCheckDone(true);
    } else if (!isLoading && !error && clientId && !initialCheckDone) {
      console.log("No client data found with ID:", clientId);
      console.log("Admin client configured:", adminClientConfigured);
      
      if (userRole === 'client') {
        toast.error("Unable to find your client information. Please contact support.");
        setInitialCheckDone(true);
      }
    }
  }, [client, isLoading, clientId, error, userRole, adminClientConfigured, initialCheckDone]);
  
  const clientMutation = useClientMutation();

  // Memoized refetch function to avoid unnecessary re-renders
  const refetchClient = useCallback(() => {
    if (clientId) {
      console.log("Refetching client data for:", clientId);
      setInitialCheckDone(false); // Reset the initial check to allow for new toasts
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
    refetchClient,
    adminClientConfigured
  };
};
