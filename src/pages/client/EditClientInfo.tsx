import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import type { Client } from '@/types/supabase';

export default function EditClientInfo() {
  const { clientId } = useParams<{ clientId: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasError) return; // Prevent refetching if there's an error
    fetchClientData();
  }, [clientId, hasError]);

  async function fetchClientData() {
    try {
      if (!clientId) return;

      const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();

      if (error) throw error;
      setClient(client);
      setHasError(false); // Reset error state on successful fetch
    } catch (error) {
      console.error('Error fetching client:', error);
      setHasError(true); // Set error state
      toast.error('Failed to load your information');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUpdateWebsiteUrl(url: string) {
    if (!clientId || !client) return;
    
    try {
      setIsSaving(true);
      
      // Basic URL validation
      if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const { error } = await supabase
        .from('clients')
        .update({
          website_url: url,
          website_url_added_at: url ? new Date().toISOString() : null
        })
        .eq('id', clientId);

      if (error) throw error;

      setClient(prev => prev ? { ...prev, website_url: url } : null);
      toast.success('Website URL updated successfully');
    } catch (error) {
      console.error('Error updating website URL:', error);
      toast.error('Failed to update website URL');
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!client) {
    return <div className="p-4">Client not found</div>;
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Your Information</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input value={client.client_name || ''} disabled />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input value={client.email || ''} disabled />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">AI Agent Name</label>
          <Input value={client.agent_name || ''} disabled />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Website URL</label>
          <div className="flex gap-2">
            <Input
              value={client.website_url || ''}
              onChange={(e) => setClient(prev => prev ? { ...prev, website_url: e.target.value } : null)}
              placeholder="Enter your website URL"
            />
            <Button
              onClick={() => handleUpdateWebsiteUrl(client.website_url || '')}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save URL'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
