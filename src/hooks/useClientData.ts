import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import type { Client, Database } from '@/types/supabase';
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { ClientFormData } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";

type DatabaseUpdateType = Database['public']['Tables']['clients']['Update'];

type ClientUpdateData = Omit<Partial<Client>, keyof DatabaseUpdateType> & DatabaseUpdateType;

export const useClientData = (clientId?: string) => {
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!clientId) {
      setIsLoading(false);
      return;
    }

    const fetchClient = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', clientId)
          .single<Database['public']['Tables']['clients']['Row']>();

        if (fetchError) throw new Error(fetchError.message);
        if (!data) throw new Error('Client not found');

        // Initialize missing fields with default values
        const clientData: Client = {
          ...data,
          urls: data.urls || [],
          drive_urls: data.drive_urls || [],
          website_url_last_checked: data.website_url_last_checked || null,
          website_url_next_check: data.website_url_next_check || null,
          drive_link_last_checked: data.drive_link_last_checked || null,
          drive_link_next_check: data.drive_link_next_check || null,
          website_url_refresh_rate: data.website_url_refresh_rate || null
        };

        setClient(clientData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch client'));
        toast.error('Failed to load client data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel(`clients:${clientId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public',
        table: 'clients',
        filter: `id=eq.${clientId}`
      }, (payload) => {
        if (payload.new) {
          const newData = payload.new as Database['public']['Tables']['clients']['Row'];
          const updatedClient: Client = {
            ...newData,
            urls: newData.urls || [],
            drive_urls: newData.drive_urls || [],
            website_url_last_checked: newData.website_url_last_checked || null,
            website_url_next_check: newData.website_url_next_check || null,
            drive_link_last_checked: newData.drive_link_last_checked || null,
            drive_link_next_check: newData.drive_link_next_check || null,
            website_url_refresh_rate: newData.website_url_refresh_rate || null
          };
          setClient(updatedClient);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clientId]);

  const updateClient = async (updates: ClientUpdateData) => {
    if (!clientId || !client) {
      toast.error('No client selected');
      return;
    }

    try {
      const updateData = updates as DatabaseUpdateType;
      const { data, error: updateError } = await supabase
        .from('clients')
        .update(updateData)
        .eq('id', clientId)
        .select()
        .single<Database['public']['Tables']['clients']['Row']>();

      if (updateError) throw new Error(updateError.message);
      if (!data) throw new Error('Failed to update client');

      const updatedClient: Client = {
        ...data,
        urls: data.urls || [],
        drive_urls: data.drive_urls || [],
        website_url_last_checked: data.website_url_last_checked || null,
        website_url_next_check: data.website_url_next_check || null,
        drive_link_last_checked: data.drive_link_last_checked || null,
        drive_link_next_check: data.drive_link_next_check || null,
        website_url_refresh_rate: data.website_url_refresh_rate || null
      };

      setClient(updatedClient);
      return updatedClient;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      toast.error(errorMessage);
      throw err;
    }
  };

  const { client: clientFromUseClient, isLoadingClient, error: clientError, refetchClient } = useClient(clientId);
  const clientMutation = useClientMutation(clientId);
  const { sendInvitation, isSending } = useClientInvitation();

  return {
    client,
    isLoading,
    error,
    updateClient,
    clientFromUseClient,
    isLoadingClient,
    clientError,
    clientMutation,
    sendInvitation,
    isSending,
    refetchClient
  };
};
