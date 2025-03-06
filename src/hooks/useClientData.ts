
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useClientData = (id: string | undefined) => {
  const { user } = useAuth();
  const [resolvedClientId, setResolvedClientId] = useState<string | undefined>(id);
  const [resolvingId, setResolvingId] = useState(id === undefined);
  
  // Only resolve client ID when needed and avoid unnecessary re-resolving
  useEffect(() => {
    const resolveClientId = async () => {
      if (!resolvingId) return;
      
      console.log("useClientData - Resolving client ID");
      console.log("useClientData - ID provided:", id);
      console.log("useClientData - User metadata client_id:", user?.user_metadata?.client_id);
      
      // If explicit ID is provided, use that first
      if (id) {
        console.log("Using provided ID:", id);
        setResolvedClientId(id);
        setResolvingId(false);
        return;
      } 
      
      // If ID in user metadata, use that next
      if (user?.user_metadata?.client_id) {
        console.log("Using client ID from user metadata:", user.user_metadata.client_id);
        setResolvedClientId(user.user_metadata.client_id);
        setResolvingId(false);
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
          } else if (data?.id) {
            console.log("Found client ID from database:", data.id);
            setResolvedClientId(data.id);
          } else {
            console.log("No client found with email:", user.email);
          }
        } catch (err) {
          console.error("Error in resolveClientId:", err);
        }
      } else {
        console.log("No client ID available from props or user metadata, and no user email to lookup");
      }
      
      setResolvingId(false);
    };
    
    if (resolvingId && user) {
      resolveClientId();
    }
  }, [id, user, resolvingId]);
  
  // If ID changes externally, reset the resolution state
  useEffect(() => {
    if (id !== undefined && id !== resolvedClientId) {
      console.log("External ID changed, updating resolved ID:", id);
      setResolvedClientId(id);
      setResolvingId(false);
    }
  }, [id, resolvedClientId]);
  
  console.log("useClientData - Resolved client ID being used:", resolvedClientId);
  
  // Only run query when we have either a resolved ID or finished resolving (even if it's null)
  const { client, isLoadingClient, error } = useClient(resolvedClientId, !resolvingId);
  const clientMutation = useClientMutation(resolvedClientId);
  const { sendInvitation } = useClientInvitation();

  return {
    client,
    isLoadingClient,
    error,
    clientMutation,
    sendInvitation,
    clientId: resolvedClientId,
    isResolvingId: resolvingId
  };
};
