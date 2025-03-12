import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types/supabase';
import { toast } from 'sonner';

// Simple spinner component
function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${className}`} />
  );
}

export default function EditClientInfo() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchClientData() {
      if (!clientId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('clients')
          .select(`
            *,
            ai_agent (
              id,
              name,
              personality
            )
          `)
          .eq('id', clientId)
          .single();

        if (error) throw error;
        setClient(data);
      } catch (err) {
        console.error('Error fetching client:', err);
        setError('Failed to load client information');
        toast.error('Failed to load client information');
      } finally {
        setIsLoading(false);
      }
    }

    fetchClientData();
  }, [clientId]);

  const handleUpdateClient = async (updates: Partial<Client>) => {
    if (!clientId || !client) return;

    try {
      setIsSaving(true);
      setError(null);

      const { error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId);

      if (error) throw error;

      setClient(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Client information updated successfully');
    } catch (err) {
      console.error('Error updating client:', err);
      setError('Failed to update client information');
      toast.error('Failed to update client information');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4">
        {error}
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-gray-500 p-4">
        Client not found
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">Edit Client Information</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={client.client_name || ''}
            onChange={(e) => handleUpdateClient({ client_name: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={client.email || ''}
            onChange={(e) => handleUpdateClient({ email: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Website URL</label>
          <input
            type="url"
            value={client.website_url || ''}
            onChange={(e) => handleUpdateClient({ 
              website_url: e.target.value,
              website_url_added_at: new Date().toISOString()
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>

        {client.ai_agent && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">AI Agent Name</label>
              <div className="text-gray-600 mt-1 px-3 py-2 bg-gray-50 rounded-md">
                {client.ai_agent.name}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">AI Agent Personality</label>
              <div className="text-gray-600 mt-1 px-3 py-2 bg-gray-50 rounded-md whitespace-pre-wrap">
                {client.ai_agent.personality}
              </div>
            </div>
          </>
        )}
      </div>

      {isSaving && (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Spinner className="h-4 w-4" />
          Saving changes...
        </div>
      )}
    </div>
  );
}
