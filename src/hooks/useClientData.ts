import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';
import type { Client } from '@/types/supabase';
import { useClient } from "./useClient";
import { useClientMutation } from "./useClientMutation";
import { useClientInvitation } from "./useClientInvitation";
import { ClientFormData } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";

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
          .single();

        if (fetchError) throw new Error(fetchError.message);
        if (!data) throw new Error('Client not found');

        setClient(data);
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
          setClient(payload.new as Client);
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [clientId]);

  const updateClient = async (updates: Partial<Client>) => {
    if (!clientId || !client) {
      toast.error('No client selected');
      return;
    }

    try {
      const { data, error: updateError } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);
      if (!data) throw new Error('Failed to update client');

      setClient(data);
      return data;
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
