
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useClientData = (id: string | undefined) => {
  const { user } = useAuth();
  const [resolvedClientId, setResolvedClientId] = useState<string | undefined>(id);
  const [resolvingId, setResolvingId] = useState(true);
  const [resolutionAttempted, setResolutionAttempted] = useState(false);
  
  // Create a memoized function for resolving client ID
  const resolveClientId = useCallback(async () => {
    try {
      setResolvingId(true);
      
      console.log("useClientData - Resolving client ID");
      console.log("useClientData - ID provided:", id);
      console.log("useClientData - User metadata client_id:", user?.user_metadata?.client_id);
      
      // If explicit ID is provided, use that first
      if (id) {
        console.log("Using provided ID:", id);
        setResolvedClientId(id);
        return;
      } 
      
      // If ID in user metadata, use that next
      if (user?.user_metadata?.client_id) {
        console.log("Using client ID from user metadata:", user.user_metadata.client_id);
        setResolvedClientId(user.user_metadata.client_id);
        return;
      }
      
      // Last resort: look up by email
      if (user?.email) {
        try {
          console.log("Looking up client ID by email:", user.email);
          const { data, error } = await supabase
            .from("clients")
            .select("id")
            .eq("email", user.email)
            .single();
            
          if (error) {
            console.error("Error finding client by email:", error);
            toast.error("Error loading client data. Please try again.");
          } else if (data?.id) {
            console.log("Found client ID from database:", data.id);
            setResolvedClientId(data.id);
            
            // Update the user metadata with the found client_id for future use
            try {
              await supabase.auth.updateUser({
                data: { client_id: data.id }
              });
              console.log("Updated user metadata with client_id:", data.id);
            } catch (updateErr) {
              console.error("Error updating user metadata:", updateErr);
            }
          } else {
            console.log("No client found with email:", user.email);
            toast.error("No client account found for your email address.");
          }
        } catch (err) {
          console.error("Error in resolveClientId:", err);
          toast.error("Error connecting to the database.");
        }
      } else {
        console.log("No client ID available from props or user metadata, and no user email to lookup");
        toast.error("User information is incomplete. Please try logging out and in again.");
      }
    } finally {
      setResolvingId(false);
      setResolutionAttempted(true);
    }
  }, [id, user]);
  
  // Resolve client ID when component mounts or dependencies change
  useEffect(() => {
    if ((id === undefined || resolvedClientId === undefined) && user && !resolutionAttempted) {
      resolveClientId();
    }
  }, [id, user, resolveClientId, resolvedClientId, resolutionAttempted]);
  
  // If ID changes externally, reset the resolution state
  useEffect(() => {
    if (id !== undefined && id !== resolvedClientId) {
      console.log("External ID changed, updating resolved ID:", id);
      setResolvedClientId(id);
      setResolvingId(false);
      setResolutionAttempted(true);
    }
  }, [id, resolvedClientId]);
  
  console.log("useClientData - Resolved client ID being used:", resolvedClientId);
  
  // Only run query when we have either a resolved ID or finished resolving (even if it's null)
  const { client, isLoadingClient, error } = useClient(resolvedClientId, resolutionAttempted);
  const clientMutation = useClientMutation(resolvedClientId);
  const { sendInvitation } = useClientInvitation();

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation,
    clientId: resolvedClientId,
    isResolvingId: resolvingId,
    resolveClientId // Export the function to allow manual resolution
  };
};
