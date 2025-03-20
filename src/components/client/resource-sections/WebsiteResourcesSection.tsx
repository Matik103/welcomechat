
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WebsiteUrls } from '@/components/client/WebsiteUrls';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { ExtendedActivityType } from '@/types/extended-supabase';
import { Json } from '@/integrations/supabase/types';

interface WebsiteResourcesSectionProps {
  clientId: string;
  isClientView?: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteResourcesSection = ({
  clientId,
  isClientView = false,
  logClientActivity
}: WebsiteResourcesSectionProps) => {
  // Wrap URL operations for notification and activity logging
  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    validateUrl,
    isValidating: isValidatingUrl,
    addWebsiteUrl: rawAddWebsiteUrl,
    deleteWebsiteUrl: rawDeleteWebsiteUrl,
    validationResult
  } = useWebsiteUrls(clientId);

  /**
   * Enhanced addWebsiteUrl with activity logging
   */
  const addWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      const result = await rawAddWebsiteUrl.mutateAsync(data);
      
      if (result) {
        await logClientActivity(
          'website_url_added',
          `Added website URL: ${data.url}`,
          {
            url: data.url,
            refresh_rate: data.refresh_rate
          }
        );
      }
      
      return result;
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
      const result = await rawDeleteWebsiteUrl.mutateAsync(urlId);
      
      if (result && urlToDelete) {
        await logClientActivity(
          'website_url_deleted',
          `Deleted website URL: ${urlToDelete.url}`,
          {
            url: urlToDelete.url,
            id: urlId
          }
        );
      }
      
      return result;
    } catch (error) {
      console.error('Error deleting website URL:', error);
      throw error;
    }
  };

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Website URLs</CardTitle>
      </CardHeader>
      <CardContent>
        <WebsiteUrls
          urls={websiteUrls || []}
          isLoading={isLoadingUrls}
          isValidating={isValidatingUrl}
          validationResult={validationResult}
          validateUrl={validateUrl}
          addWebsiteUrl={addWebsiteUrl}
          deleteWebsiteUrl={deleteWebsiteUrl}
          isClientView={isClientView}
        />
      </CardContent>
    </Card>
  );
};
