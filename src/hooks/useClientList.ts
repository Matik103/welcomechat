import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Client, ClientListResponse } from "@/types/client";

export const useClientList = () => {
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ClientListResponse> => {
      const { data, error, count } = await supabase
        .from("ai_agents")
        .select("*", { count: "exact" })
        .eq('interaction_type', 'config')
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching clients:", error);
        throw error;
      }

      // Ensure data is not null before mapping
      const clients = data ? data.map(mapToClient) : [];

      return {
        data: clients,
        count: count || 0,
      };
    },
  });

  // Helper function to map database data to Client type
  const mapToClient = (client: any): Client => {
    // Convert Supabase Json type to standard Record<string, any>
    let widgetSettingsRecord: Record<string, any> = {};
    
    if (client.settings) {
      if (typeof client.settings === 'object') {
        widgetSettingsRecord = { ...client.settings };
      } else if (typeof client.settings === 'string') {
        try {
          widgetSettingsRecord = JSON.parse(client.settings);
        } catch (e) {
          widgetSettingsRecord = {};
        }
      }
    }
    
    const userId = client.user_id !== undefined ? client.user_id : null;
    
    return {
      id: client.id,
      client_id: client.client_id || client.id,
      client_name: client.client_name || '',
      email: client.email || '',
      company: client.company || '',
      description: client.description || '',
      logo_url: client.logo_url || '',
      logo_storage_path: client.logo_storage_path || '',
      created_at: client.created_at || '',
      updated_at: client.updated_at || '',
      deleted_at: client.deleted_at,
      deletion_scheduled_at: client.deletion_scheduled_at,
      last_active: client.last_active,
      status: client.status || 'active',
      agent_name: client.name || '',
      agent_description: client.agent_description || '',
      widget_settings: widgetSettingsRecord,
      name: client.name || '',
      is_error: !!client.is_error,
      user_id: userId
    };
  };

  return {
    clients: data?.data || [],
    count: data?.count || 0,
    isLoading,
    error,
    refetch,
  };
};
