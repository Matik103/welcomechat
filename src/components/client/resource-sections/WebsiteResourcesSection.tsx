
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebsiteUrlForm } from '@/components/client/website-urls/WebsiteUrlForm';
import { WebsiteUrlFormData } from '@/types/website-url';
import { toast } from 'sonner';
import { useWebsiteUrlsMutation } from '@/hooks/website-urls/useWebsiteUrlsMutation';
import { WebsiteUrls } from '@/components/client/website-urls'; 

interface WebsiteResourcesSectionProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>;
}

export const WebsiteResourcesSection: React.FC<WebsiteResourcesSectionProps> = ({
  clientId,
  onResourceChange,
  logClientActivity
}) => {
  const [initializing, setInitializing] = useState(true);
  const { addWebsiteUrl, addWebsiteUrlMutation } = useWebsiteUrlsMutation(clientId);

  useEffect(() => {
    // Debug info
    console.log("WebsiteResourcesSection rendered with clientId:", clientId);
    
    // Simulate initialization complete
    const timer = setTimeout(() => {
      setInitializing(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [clientId]);

  const handleAddUrl = async (data: WebsiteUrlFormData) => {
    try {
      console.log("Adding website URL:", data, "for client:", clientId);
      
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
      await addWebsiteUrl({ 
        ...data, 
        client_id: clientId 
      });
      
      // Log client activity
      await logClientActivity();
      
      // Notify parent component about the change if callback provided
      if (onResourceChange) {
        onResourceChange();
      }
      
      toast.success("Website URL added successfully");
      return Promise.resolve();
    } catch (error) {
      console.error("Error adding website URL:", error);
      toast.error(`Failed to add website URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return Promise.reject(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website URLs</CardTitle>
        <CardDescription>
          Add URLs that contain information your AI assistant should learn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <WebsiteUrlForm 
          onSubmit={handleAddUrl}
          isSubmitting={addWebsiteUrlMutation.isPending}
          clientId={clientId}
        />
        
        {!initializing && clientId && (
          <WebsiteUrls 
            clientId={clientId} 
            onResourceChange={onResourceChange}
            logClientActivity={logClientActivity}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default WebsiteResourcesSection;
