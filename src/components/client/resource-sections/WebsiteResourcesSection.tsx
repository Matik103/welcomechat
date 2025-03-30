
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WebsiteUrlForm } from "../website-urls/WebsiteUrlForm";
import { WebsiteUrls } from "../website-urls";
import { useWebsiteUrlsMutation } from "@/hooks/website-urls/useWebsiteUrlsMutation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const { 
    addWebsiteUrl, 
    addWebsiteUrlMutation, 
  } = useWebsiteUrlsMutation(clientId);

  const handleAddUrl = async (data: { url: string; refresh_rate: number }) => {
    setIsAddingUrl(true);
    try {
      console.log("Adding URL with client ID:", clientId);
      console.log("URL data:", data);
      
      if (!clientId) {
        toast.error("Client ID is missing. Please reload the page or contact support.");
        return;
      }
      
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
      
      toast.success("Website URL added successfully");
    } catch (error) {
      console.error("Error adding website URL:", error);
      if (error instanceof Error) {
        toast.error(`Error adding website URL: ${error.message}`);
      } else {
        toast.error("An unknown error occurred while adding the website URL");
      }
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
            logClientActivity={logClientActivity}
          />
        </CardContent>
      </Card>
    </div>
  );
}
