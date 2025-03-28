
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WebsiteUrlForm } from "../website-urls/WebsiteUrlForm";
import { WebsiteUrls } from "../website-urls";
import { useWebsiteUrlsMutation } from "@/hooks/website-urls/useWebsiteUrlsMutation";

interface WebsiteResourcesSectionProps {
  clientId: string;
  logClientActivity: () => Promise<void>;
  onResourceChange?: () => void;
}

export function WebsiteResourcesSection({ 
  clientId, 
  logClientActivity,
  onResourceChange
}: WebsiteResourcesSectionProps) {
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const { 
    addWebsiteUrl, 
    addWebsiteUrlMutation, 
  } = useWebsiteUrlsMutation(clientId);

  const handleAddUrl = async (data: { url: string; refresh_rate: number }) => {
    setIsAddingUrl(true);
    try {
      await addWebsiteUrl({
        client_id: clientId,
        url: data.url,
        refresh_rate: data.refresh_rate,
        status: 'pending'
      });
      
      // Log activity
      await logClientActivity();
      
      // Notify parent component if needed
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error("Error adding website URL:", error);
    } finally {
      setIsAddingUrl(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Website URLs</CardTitle>
          <CardDescription>
            Add website URLs that your AI assistant can learn from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebsiteUrlForm 
            onAdd={handleAddUrl} 
            isAdding={isAddingUrl || addWebsiteUrlMutation.isPending}
            clientId={clientId}
          />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Existing Website URLs</CardTitle>
          <CardDescription>
            Manage the websites your AI assistant uses as knowledge sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          <WebsiteUrls 
            clientId={clientId}
            onResourceChange={onResourceChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}
