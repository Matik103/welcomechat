
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client";
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
      return data;
    },
    enabled: !!id,
  });

  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      try {
        if (id) {
          const { error } = await supabase
            .from("clients")
            .update(data)
            .eq("id", id);
          if (error) throw error;
          return id;
        } else {
          const { data: newClient, error } = await supabase
            .from("clients")
            .insert(data)
            .select()
            .single();
          if (error) throw error;
          
          // Check for the creation activity in client_activities
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
        throw error;
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
