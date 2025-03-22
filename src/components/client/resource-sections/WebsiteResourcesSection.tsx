import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { WebsiteUrls } from '@/components/client/WebsiteUrls';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { ActivityType } from '@/types/client';
import { Json } from '@/integrations/supabase/types';
import { ValidationResult } from '@/types/website-url';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { toast } from 'sonner';
import { WebsiteUrlForm } from '@/components/client/website-urls/WebsiteUrlForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface WebsiteResourcesSectionProps {
  clientId: string;
  isClientView: boolean;
  logClientActivity: (activity_type: ActivityType | string, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteResourcesSection: React.FC<WebsiteResourcesSectionProps> = ({
  clientId,
  isClientView,
  logClientActivity
}) => {
  // State for Firecrawl configuration check
  const [isCheckingConfig, setIsCheckingConfig] = useState(false);
  const [configStatus, setConfigStatus] = useState<{ isConfigured: boolean; message: string } | null>(null);

  // Get website URLs from hook
  const {
    websiteUrls,
    isLoading,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
    refetchWebsiteUrls
  } = useWebsiteUrls(clientId);

  // Get store website hook
  const webstoreHook = {
    addWebsite: addWebsiteUrlMutation.mutateAsync,
    isStoring: false,
    storeWebsiteContent: async (website: any) => {
      return { success: true };
    }
  };

  // Check Firecrawl configuration on mount
  useEffect(() => {
    checkFirecrawlConfig();
  }, []);

  // Function to check Firecrawl configuration
  const checkFirecrawlConfig = async () => {
    setIsCheckingConfig(true);
    try {
      const result = await FirecrawlService.verifyFirecrawlConfig();
      setConfigStatus({
        isConfigured: result.success,
        message: result.error || result.data?.message || 'Configuration status unknown'
      });
    } catch (error) {
      console.error('Error checking Firecrawl configuration:', error);
      setConfigStatus({
        isConfigured: false,
        message: error instanceof Error ? error.message : 'Unknown error checking configuration'
      });
    } finally {
      setIsCheckingConfig(false);
    }
  };

  /**
   * Enhanced addWebsiteUrl with activity logging
   */
  const addWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      // Validate URL first
      const validation = FirecrawlService.validateUrl(data.url);
      if (!validation.isValid) {
        toast.error(validation.error || "Invalid URL");
        return;
      }

      // Add website to database
      await addWebsiteUrlMutation.mutateAsync(data);
      
      // Log the activity
      await logClientActivity(
        'website_url_added',
        `Added website URL: ${data.url}`,
        {
          url: data.url,
          refresh_rate: data.refresh_rate
        }
      );

      // Now process the website with Firecrawl
      const documentId = `web-${Date.now()}`;
      const processResult = await FirecrawlService.processDocument(
        data.url,
        "website",
        clientId,
        "AI Assistant",
        documentId
      );

      if (processResult.success) {
        toast.success("Website processing initiated successfully");
      } else {
        console.error("Failed to process website:", processResult.error);
        toast.error(`Website added but processing failed: ${processResult.error}`);
      }
      
      // Refetch the list to show the new item
      refetchWebsiteUrls();
    } catch (error) {
      console.error('Error adding website URL:', error);
      throw error;
    }
  };

  /**
   * Enhanced deleteWebsiteUrl with activity logging
   */
  const deleteWebsiteUrl = async (urlId: number) => {
    try {
      const urlToDelete = websiteUrls?.find(url => url.id === urlId);
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      
      if (urlToDelete) {
        await logClientActivity(
          'website_url_deleted',
          `Deleted website URL: ${urlToDelete.url}`,
          {
            url: urlToDelete.url,
            id: urlId
          }
        );
      }
    } catch (error) {
      console.error('Error deleting website URL:', error);
      throw error;
    }
  };

  return (
    <Card className="p-4">
      {configStatus && (
        <Alert 
          variant={configStatus.isConfigured ? "default" : "destructive"}
          className="mb-4"
        >
          {configStatus.isConfigured ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertTitle>
            {configStatus.isConfigured ? "Firecrawl Ready" : "Firecrawl Configuration Issue"}
          </AlertTitle>
          <AlertDescription>
            {configStatus.message}
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="list" className="flex-1">
            Website List
          </TabsTrigger>
          <TabsTrigger value="add" className="flex-1">
            Add Website
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list">
          <WebsiteUrls
            urls={websiteUrls?.map(url => ({
              ...url,
              refresh_rate: url.refresh_rate || 30 // Ensure refresh_rate is always defined
            })) || []}
            isLoading={isLoading}
            onAdd={addWebsiteUrl}
            onDelete={deleteWebsiteUrl}
            isClientView={isClientView}
            isAdding={addWebsiteUrlMutation.isPending}
            isDeleting={deleteWebsiteUrlMutation.isPending}
            agentName="AI Assistant"
          />
        </TabsContent>

        <TabsContent value="add">
          <WebsiteUrlForm 
            clientId={clientId}
            onAddSuccess={() => refetchWebsiteUrls()}
            webstoreHook={webstoreHook}
          />
        </TabsContent>
      </Tabs>
    </Card>
  );
};
