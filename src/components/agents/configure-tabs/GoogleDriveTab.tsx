
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useDriveLinks } from '@/hooks/useDriveLinks';
import { createClientActivity } from '@/services/clientActivityService';

interface GoogleDriveTabProps {
  clientId: string;
  agentName: string;
  onSuccess: () => void;
}

export function GoogleDriveTab({ clientId, agentName, onSuccess }: GoogleDriveTabProps) {
  const [url, setUrl] = useState('');
  const { documentLinks, addDocumentLink, isAddingLink } = useDriveLinks(clientId);

  const validateDriveUrl = (url: string) => {
    const googleDriveRegex = /https:\/\/(drive|docs|sheets|slides)\.google\.com\/.+/;
    return googleDriveRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateDriveUrl(url)) {
      toast.error('Please enter a valid Google Drive, Docs, Sheets, or Slides URL');
      return;
    }

    try {
      await addDocumentLink({
        link: url,
        refresh_rate: 24, // Default refresh rate in hours
        document_type: 'google_drive',
        // Add agent-specific metadata
        metadata: {
          agent_name: agentName, 
          source: 'agent_config'
        }
      });
      
      // Log activity
      await createClientActivity(
        clientId,
        agentName,
        'url_added',
        `Google Drive link added for agent ${agentName}`,
        {
          url: url,
          agent_name: agentName,
          type: 'google_drive'
        }
      );
      
      toast.success('Google Drive link added successfully');
      setUrl('');
      onSuccess();
    } catch (error) {
      console.error('Error adding Google Drive link:', error);
      toast.error(`Failed to add Google Drive link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="drive-url">Google Drive URL</Label>
          <Input
            id="drive-url"
            placeholder="https://docs.google.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">
            Enter the URL of a Google Drive folder, Google Doc, Google Sheet, or Google Slide.
          </p>
        </div>
        
        <Button 
          type="submit" 
          disabled={isAddingLink || !url.trim()}
        >
          {isAddingLink ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Adding...
            </>
          ) : (
            'Add Drive Link'
          )}
        </Button>
      </form>
      
      <div className="text-sm text-muted-foreground">
        <p>Supported Google links:</p>
        <ul className="list-disc pl-5 mt-2">
          <li>Google Drive folders</li>
          <li>Google Docs</li>
          <li>Google Sheets</li>
          <li>Google Slides</li>
        </ul>
        <p className="mt-3">
          Make sure the Google Drive resources are publicly accessible or shared with your service account email.
        </p>
      </div>
    </div>
  );
}
