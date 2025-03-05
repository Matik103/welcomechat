
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
        .maybeSingle();
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
          // Create new client without using single()
          const { data: newClients, error } = await supabase
            .from("clients")
            .insert([{
              client_name: data.client_name,
              email: data.email,
              agent_name: data.agent_name,
              widget_settings: data.widget_settings || {},
              status: 'active'
            }])
            .select('*');

          if (error) {
            console.error("Error creating client:", error);
            throw error;
          }

          if (!newClients || newClients.length === 0) {
            throw new Error("Failed to create client - no data returned");
          }

          const newClient = newClients[0];

          // Send client invitation directly
          try {
            console.log("Sending invitation to new client:", newClient.email);
            
            const { data: inviteData, error: inviteError } = await supabase.functions.invoke("send-client-invitation", {
              body: {
                clientId: newClient.id,
                email: newClient.email,
                clientName: newClient.client_name
              }
            });
            
            if (inviteError) {
              console.error("Error sending invitation:", inviteError);
              toast.warning("Client created but invitation email failed to send");
            } else {
              toast.success("Setup link sent to client's email");
            }
          } catch (inviteError: any) {
            console.error("Exception in invitation process:", inviteError);
            toast.warning("Client created but invitation process failed");
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

  const sendInvitation = async (clientId: string, email: string, clientName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-client-invitation", {
        body: {
          clientId,
          email,
          clientName
        }
      });
      
      if (error) {
        console.error("Error sending invitation:", error);
        toast.error(`Failed to send invitation: ${error.message}`);
        throw error;
      }
      
      toast.success("Setup link sent to client's email");
      return data;
    } catch (error: any) {
      console.error("Exception in invitation process:", error);
      toast.error(`Error: ${error.message || "Failed to send invitation"}`);
      throw error;
    }
  };

  return {
    client,
    isLoadingClient,
    clientMutation,
    sendInvitation
  };
};
