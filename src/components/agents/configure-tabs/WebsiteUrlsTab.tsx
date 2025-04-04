
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWebsiteUrlsMutation } from '@/hooks/website-urls/useWebsiteUrlsMutation';
import { WebsiteUrlFormData } from '@/types/website-url';
import { WebsiteUrls } from '@/components/client/website-urls';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { useStoreWebsiteContent } from '@/hooks/useStoreWebsiteContent';

interface WebsiteUrlsTabProps {
  clientId: string;
  agentName: string;
  onSuccess: () => void;
}

export function WebsiteUrlsTab({ clientId, agentName, onSuccess }: WebsiteUrlsTabProps) {
  const [url, setUrl] = useState('');
  const [refreshRate, setRefreshRate] = useState(30); // Default 30 days
  const { addWebsiteUrl, addWebsiteUrlMutation } = useWebsiteUrlsMutation(clientId);
  const storeWebsiteContent = useStoreWebsiteContent(clientId);

  const validateUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateUrl(url)) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      const websiteUrlData: WebsiteUrlFormData = {
        url: url,
        refresh_rate: refreshRate,
        client_id: clientId,
        metadata: {
          agent_name: agentName,
          source: 'agent_config',
          added_at: new Date().toISOString(),
          last_interaction: null,
          ai_notes: '',
          tags: [],
          status_history: [{
            status: 'added',
            timestamp: new Date().toISOString()
          }]
        }
      };
      
      // Add the website URL to the database
      const newUrl = await addWebsiteUrl(websiteUrlData);
      
      // Process the website content
      if (newUrl) {
        toast.info('Processing website content...');
        storeWebsiteContent.mutate(newUrl);
      }
      
      // Log activity
      await createClientActivity(
        clientId,
        agentName,
        ActivityType.URL_ADDED,
        `Website URL added for agent ${agentName}`,
        {
          url: url,
          agent_name: agentName,
          type: 'website_url'
        }
      );
      
      toast.success('Website URL added successfully');
      setUrl('');
      onSuccess();
    } catch (error) {
      console.error('Error adding website URL:', error);
      toast.error(`Failed to add website URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Helper function to log client activity when deleting URLs
  const logClientActivity = async (): Promise<void> => {
    try {
      await createClientActivity(
        clientId,
        agentName,
        ActivityType.URL_REMOVED,
        `Website URL deleted for agent ${agentName}`,
        { agent_name: agentName }
      );
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="website-url">Website URL</Label>
          <Input
            id="website-url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter the URL of a website you want the agent to learn from.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="refresh-rate">Refresh Rate (days)</Label>
          <Input
            id="refresh-rate"
            type="number"
            min="1"
            max="365"
            value={refreshRate}
            onChange={(e) => setRefreshRate(parseInt(e.target.value) || 30)}
          />
          <p className="text-xs text-muted-foreground">
            How often the website content should be refreshed (1-365 days).
          </p>
        </div>
        
        <Button 
          type="submit" 
          disabled={addWebsiteUrlMutation.isPending || storeWebsiteContent.isPending || !url.trim()}
        >
          {(addWebsiteUrlMutation.isPending || storeWebsiteContent.isPending) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {storeWebsiteContent.isPending ? 'Processing...' : 'Adding...'}
            </>
          ) : (
            'Add Website URL'
          )}
        </Button>
      </form>
      
      <div className="mt-6">
        <h3 className="text-sm font-medium mb-2">Added Website URLs</h3>
        <WebsiteUrls 
          clientId={clientId}
          onResourceChange={onSuccess}
          logClientActivity={logClientActivity}
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>Website content will be processed and made available to your AI agent.</p>
        <p className="mt-2">The agent will use this information to provide more accurate and context-aware responses.</p>
      </div>
    </div>
  );
}
