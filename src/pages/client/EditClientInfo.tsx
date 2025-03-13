import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Client } from '@/types/client';
import { ExtendedActivityType } from '@/types/activity';
import { logActivity } from '@/utils/activity';
import { ClientForm } from '@/components/client/ClientForm';
import { toast } from 'react-hot-toast';
import { ClientResourceSections } from '@/components/client/ClientResourceSections';
import { Json } from '@/types/supabase';
import { ClientWithAgent } from '@/types/client';

export default function EditClientInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClient();
  }, [id]);

  const fetchClient = async () => {
    try {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*, ai_agents(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch client');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !id) return;

    try {
      setLoading(true);
      
      // Update client info
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          name: client.name,
          email: client.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (clientError) throw clientError;

      // Update AI agent if it exists
      if (client.ai_agents) {
        const { error: agentError } = await supabase
          .from('ai_agents')
          .update({
            name: client.ai_agents.name,
            description: client.ai_agents.description,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', id);

        if (agentError) throw agentError;
      }

      await logActivity({
        client_id: id,
        activity_type: 'update_client',
        description: `Updated client information for ${client.name}`,
        metadata: { client_id: id }
      });

      toast.success('Client updated successfully');
      navigate('/clients');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update client';
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!client?.email || !id) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: id,
          email: client.email 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send invitation');
      }

      await logActivity({
        client_id: id,
        activity_type: 'send_invitation',
        description: `Sent invitation email to ${client.email}`,
        metadata: { client_id: id, email: client.email }
      });

      toast.success('Invitation sent successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send invitation';
      toast.error(message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!client) return <div>Client not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Client Information</h1>
      
      <form onSubmit={handleSubmit} className="max-w-lg">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={client.name}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={client.email}
            onChange={(e) => setClient({ ...client, email: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {client.ai_agents && (
          <>
            <h2 className="text-xl font-semibold mt-6 mb-4">AI Agent Settings</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Agent Name</label>
              <input
                type="text"
                value={client.ai_agents.name}
                onChange={(e) => setClient({
                  ...client,
                  ai_agents: { ...client.ai_agents, name: e.target.value }
                })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={client.ai_agents.description || ''}
                onChange={(e) => setClient({
                  ...client,
                  ai_agents: { ...client.ai_agents, description: e.target.value }
                })}
                className="w-full p-2 border rounded"
                rows={3}
              />
            </div>
          </>
        )}

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Save Changes
          </button>
          
          <button
            type="button"
            onClick={sendInvitation}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            Send Invitation
          </button>
        </div>
      </form>

      <ClientResourceSections
        clientId={id}
        isClientView={false}
        logClientActivity={async (activity_type: ExtendedActivityType, description: string, metadata?: Json) => {
          // Implement activity logging
          console.log('Client activity:', { activity_type, description, metadata });
          await supabase.from('client_activities').insert({
            client_id: id,
            activity_type,
            description,
            metadata
          });
        }}
      />
    </div>
  );
}
