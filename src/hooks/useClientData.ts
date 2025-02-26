
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData, Client } from "@/types/client";
import { toast } from "sonner";

export const useClientData = (id: string | undefined) => {
  const { data: client, isLoading: isLoadingClient } = useQuery({
    queryKey: ["client", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Client;
    },
    enabled: !!id,
  });

  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        if (id) {
          // Update existing client
          const { error } = await supabase
            .from("clients")
            .update({
              client_name: data.client_name,
              email: data.email,
              agent_name: data.agent_name,
              widget_settings: data.widget_settings,
            })
            .eq("id", id);
          if (error) throw error;
          return id;
        } else {
          // Create new client with explicit returning clause
          const { data: newClient, error } = await supabase
            .from("clients")
            .insert([{
              client_name: data.client_name,
              email: data.email,
              agent_name: data.agent_name,
              widget_settings: data.widget_settings || {},
              status: 'active'
            }])
            .select('*')
            .single();

          if (error) {
            console.error("Error creating client:", error);
            throw error;
          }

          if (!newClient) {
            throw new Error("Failed to create client - no data returned");
          }

          // Check for AI agent table creation activity
          const { data: activity, error: activityError } = await supabase
            .from("client_activities")
            .select("*")
            .eq("client_id", newClient.id)
            .eq("activity_type", "ai_agent_table_created")
            .single();

          if (!activityError && activity) {
            toast.success(`Successfully created AI Agent table for ${data.agent_name}`);
          }

          return newClient.id;
        }
      } catch (error: any) {
        console.error("Error in client mutation:", error);
        throw new Error(error.message || "Failed to save client");
      }
    },
    onSuccess: () => {
      toast.success(id ? "Client updated successfully" : "Client created successfully");
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    client,
    isLoadingClient,
    clientMutation,
  };
};
