
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { ClientFormData } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useClientData = (id: string | undefined) => {
  const { user } = useAuth();
  const [resolvedClientId, setResolvedClientId] = useState<string | undefined>(id);
  const [isResolvingId, setIsResolvingId] = useState(false);
  
  // Resolve client ID from multiple sources
  useEffect(() => {
    const resolveClientId = async () => {
      // Already have an ID from props
      if (id) {
        console.log("Using provided client ID:", id);
        setResolvedClientId(id);
        return;
      }
      
      // Check user metadata
      if (user?.user_metadata?.client_id) {
        console.log("Using client ID from user metadata:", user.user_metadata.client_id);
        setResolvedClientId(user.user_metadata.client_id);
        return;
      }
      
      // Last resort - fetch from user_roles table
      if (user?.id) {
        try {
          setIsResolvingId(true);
          console.log("Fetching client ID from user_roles for user:", user.id);
          
          const { data, error } = await supabase
            .from("user_roles")
            .select("client_id")
            .eq("user_id", user.id)
            .eq("role", "client")
            .maybeSingle();
            
          if (error) {
            console.error("Error fetching client ID from user_roles:", error);
            toast.error("Failed to retrieve client information");
            return;
          }
          
          if (data?.client_id) {
            console.log("Found client ID in user_roles:", data.client_id);
            setResolvedClientId(data.client_id);
            
            // Update user metadata for future use
            const { error: updateError } = await supabase.auth.updateUser({
              data: { client_id: data.client_id }
            });
            
            if (updateError) {
              console.error("Failed to update user metadata:", updateError);
            }
          } else {
            console.warn("No client ID found in user_roles table");
          }
        } catch (error) {
          console.error("Error resolving client ID:", error);
        } finally {
          setIsResolvingId(false);
        }
      }
    };
    
    resolveClientId();
  }, [id, user]);
  
  const { client, isLoadingClient, error } = useClient(resolvedClientId);
  const clientMutation = useClientMutation(resolvedClientId);
  const { sendInvitation } = useClientInvitation();

  return {
    client,
    isLoadingClient: isLoadingClient || isResolvingId,
    error,
    clientMutation,
    sendInvitation,
    clientId: resolvedClientId
  };
};
