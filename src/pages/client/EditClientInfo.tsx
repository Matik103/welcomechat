import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'react-hot-toast';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { ExtendedActivityType, Json } from '@/types/supabase';
import { ClientWithAgent } from '@/types/client';

export const EditClientInfo: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<ClientWithAgent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select(`
            *,
            ai_agents (
              id,
              agent_name,
              personality
            )
          `)
          .eq('id', clientId)
          .single();

        if (error) throw error;
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch client'));
        toast.error('Failed to load client information');
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId]);

  const handleSubmit = async (data: { client_name: string; email: string; agent_name: string }) => {
    setIsLoading(true);
    setError(null);

    try {
      // Update client information
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          name: data.client_name,
          email: data.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', clientId);

      if (clientError) throw clientError;

      // Update AI agent information
      if (client?.ai_agent_id) {
        const { error: agentError } = await supabase
          .from('ai_agents')
          .update({
            agent_name: data.agent_name,
            updated_at: new Date().toISOString()
          })
          .eq('id', client.ai_agent_id);

        if (agentError) throw agentError;
      }

      toast.success('Client information updated successfully');
      
      // Refresh client data
      const { data: updatedClient, error: fetchError } = await supabase
        .from('clients')
        .select(`
          *,
          ai_agents (
            id,
            agent_name,
            personality
          )
        `)
        .eq('id', clientId)
        .single();

      if (fetchError) throw fetchError;
      setClient(updatedClient);

    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update client'));
      toast.error('Failed to update client information');
    } finally {
      setIsLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!client?.email) return;

    try {
      // Call your email service here
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: client.email,
          clientName: client.name,
        }),
      });

      if (!response.ok) throw new Error('Failed to send invitation');
      
      toast.success('Invitation sent successfully');
    } catch (err) {
      toast.error('Failed to send invitation');
    }
  };

  if (!clientId) {
    return <div>No client ID provided</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Client Information</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <ClientForm
          client={client}
          isLoading={isLoading}
          error={error}
          onSubmit={handleSubmit}
          onSendInvitation={sendInvitation}
        />
      </div>

      <ClientResourceSections
        clientId={clientId}
        isClientView={false}
        logClientActivity={async (activity_type: ExtendedActivityType, description: string, metadata?: Json) => {
          // Implement activity logging
          console.log('Client activity:', { activity_type, description, metadata });
          await supabase.from('client_activities').insert({
            client_id: clientId,
            activity_type,
            description,
            metadata
          });
        }}
      />
    </div>
  );
};
