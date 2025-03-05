
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
        const sanitizedAgentName = data.agent_name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_');
        const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();
        const updatedData = {
          ...data,
          agent_name: finalAgentName,
        };

        if (id) {
          const { error } = await supabase
            .from("clients")
            .update({
              client_name: updatedData.client_name,
              email: updatedData.email,
              agent_name: updatedData.agent_name,
              widget_settings: updatedData.widget_settings,
            })
            .eq("id", id);
          if (error) throw error;

          try {
            const user = await supabase.auth.getUser();
            const isClientUser = user.data.user?.user_metadata?.client_id === id;
            if (isClientUser) {
              await supabase.from("client_activities").insert({
                client_id: id,
                activity_type: "client_updated",
                description: "updated their account information",
                metadata: {}
              });
            }
          } catch (activityError) {
            console.error("Error logging activity:", activityError);
          }
          
          return id;
        } else {
          const { data: newClients, error } = await supabase
            .from("clients")
            .insert([{
              client_name: updatedData.client_name,
              email: updatedData.email,
              agent_name: updatedData.agent_name,
              widget_settings: updatedData.widget_settings || {},
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

          try {
            toast.info("Sending setup email...");
            const { error: inviteError } = await supabase.functions.invoke("send-client-invitation", {
              body: {
                clientId: newClient.id,
                email: newClient.email,
                clientName: newClient.client_name
              }
            });
            if (inviteError) {
              console.error("Error sending invitation:", inviteError);
              toast.error(`Failed to send setup email: ${inviteError.message}`);
            } else {
              toast.success("Setup email sent to client");
            }
          } catch (inviteError: any) {
            console.error("Exception in invitation process:", inviteError);
            toast.error(`Failed to send setup email: ${inviteError.message || "Unknown error"}`);
          }

          return newClient.id;
        }
      } catch (error: any) {
        console.error("Error in client mutation:", error);
        throw new Error(error.message || "Failed to save client");
      }
    },
    onSuccess: (clientId) => {
      if (id) {
        toast.success("Client updated successfully");
      } else {
        toast.success("Client created successfully");
      }
    },
    onError: (error: any) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const sendInvitation = async (
    id: string,
    email: string,
    clientName: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-client-invitation",
        {
          body: {
            clientId: id,
            email,
            clientName,
          },
        }
      );

      if (error) throw error;

      // If a password was returned, store this information in last_active field
      // which is an existing field in the clients table
      if (data.password) {
        console.log("Marking client as having received credentials...");
        await supabase
          .from("clients")
          .update({ last_active: new Date().toISOString() })
          .eq("id", id);
      }

      toast.success("Invitation sent successfully!");
      return data;
    } catch (error: any) {
      console.error("Error sending invitation:", error);
      toast.error(
        error.message || "Failed to send invitation. Please try again."
      );
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
