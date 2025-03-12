import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'react-hot-toast';

interface ClientFormData {
  name: string;
  email: string;
  agent_name: string;
}

export default function AddEditClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    agent_name: ''
  });

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      // Load both client and AI agent data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          id,
          name,
          email,
          ai_agents (
            agent_name
          )
        `)
        .eq('id', id)
        .single();

      if (clientError) throw clientError;
      if (!clientData) throw new Error('Client not found');

      setFormData({
        name: clientData.name,
        email: clientData.email,
        agent_name: clientData.ai_agents?.[0]?.agent_name || ''
      });
    } catch (error) {
      console.error('Error loading client:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        // Update existing client
        const { error: clientError } = await supabase
          .from('clients')
          .update({
            name: formData.name,
            email: formData.email,
            updated_at: new Date().toISOString()
          })
          .eq('id', id);

        if (clientError) throw clientError;

        // Update AI agent name if it exists
        const { error: agentError } = await supabase
          .from('ai_agents')
          .update({
            agent_name: formData.agent_name,
            updated_at: new Date().toISOString()
          })
          .eq('client_id', id);

        if (agentError) throw agentError;

        toast.success('Client updated successfully');
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            name: formData.name,
            email: formData.email
          })
          .select('id')
          .single();

        if (clientError) throw clientError;

        // Create AI agent record
        const { error: agentError } = await supabase
          .from('ai_agents')
          .insert({
            client_id: newClient.id,
            agent_name: formData.agent_name
          });

        if (agentError) throw agentError;

        toast.success('Client created successfully');
      }

      // Navigate back to client list
      navigate('/admin/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error('Failed to save client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">
        {id ? 'Edit Client' : 'Add New Client'}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Client Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email Address
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            AI Agent Name
          </label>
          <input
            type="text"
            value={formData.agent_name}
            onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/clients')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : id ? 'Update Client' : 'Create Client'}
          </button>
        </div>
      </form>
    </div>
  );
} 