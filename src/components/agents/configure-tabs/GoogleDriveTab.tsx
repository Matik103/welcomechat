
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useDriveLinks } from '@/hooks/useDriveLinks';
import { createClientActivity } from '@/services/clientActivityService';
import { DocumentLinksList } from '@/components/client/drive-links/DocumentLinksList';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GoogleDriveTabProps {
  clientId: string;
  agentName: string;
  onSuccess: () => void;
}

export function GoogleDriveTab({ clientId, agentName, onSuccess }: GoogleDriveTabProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { 
    documentLinks, 
    addDocumentLink, 
    isAddingLink, 
    deleteDocumentLink,
    isDeletingLink,
    refetch 
  } = useDriveLinks(clientId);

  const validateDriveUrl = (url: string) => {
    const googleDriveRegex = /https:\/\/(drive|docs|sheets|slides)\.google\.com\/.+/;
    return googleDriveRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateDriveUrl(url)) {
      setError('Please enter a valid Google Drive, Docs, Sheets, or Slides URL');
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
      setError(null);
      
      // Refresh the list of drive links
      if (refetch) {
        await refetch();
      }
      
      onSuccess();
    } catch (error) {
      console.error('Error adding Google Drive link:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to add Google Drive link: ${errorMessage}`);
      toast.error(`Failed to add Google Drive link: ${errorMessage}`);
    }
  };

  // Helper function to log client activity for deletions
  const handleDeleteLink = async (linkId: number) => {
    try {
      await deleteDocumentLink(linkId);
      
      // Log the activity
      await createClientActivity(
        clientId,
        agentName,
        'url_removed',
        `Google Drive link removed for agent ${agentName}`,
        {
          agent_name: agentName,
          type: 'google_drive'
        }
      );
      
      // Refresh the list
      if (refetch) {
        await refetch();
      }
      
      onSuccess();
      toast.success('Google Drive link removed successfully');
    } catch (error) {
      console.error('Error removing Google Drive link:', error);
      toast.error(`Failed to remove Google Drive link: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
        
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
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
      
      {documentLinks && documentLinks.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">Added Google Drive Links</h3>
          <DocumentLinksList
            links={documentLinks}
            isLoading={false}
            onDelete={handleDeleteLink}
            isDeleting={isDeletingLink}
          />
        </div>
      )}
      
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
