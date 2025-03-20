
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { WebsiteUrls } from '@/components/client/WebsiteUrls';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { ExtendedActivityType } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';
import { ValidationResult } from '@/types/website-url';

interface WebsiteResourcesSectionProps {
  clientId: string;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteResourcesSection: React.FC<WebsiteResourcesSectionProps> = ({
  clientId,
  isClientView,
  logClientActivity
}) => {
  // State for URL validation
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  // Get website URLs from hook
  const {
    websiteUrls,
    isLoading,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation
  } = useWebsiteUrls(clientId);

  // Custom URL validator
  const validateUrl = async (url: string): Promise<ValidationResult> => {
    setValidatingUrl(true);
    try {
      // Mock validation result
      const result: ValidationResult = {
        isValid: true,
        details: {
          scrapability: 'high',
          contentType: 'text/html',
          statusCode: 200,
          pageSize: '50KB',
          estimatedTokens: 5000
        }
      };
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Error validating URL:', error);
      const errorResult: ValidationResult = {
        isValid: false,
        message: 'Failed to validate URL'
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setValidatingUrl(false);
    }
  };

  /**
   * Enhanced addWebsiteUrl with activity logging
   */
  const addWebsiteUrl = async (data: { url: string; refresh_rate: number }) => {
    try {
      await addWebsiteUrlMutation.mutateAsync(data);
      
      await logClientActivity(
        'website_url_added',
        `Added website URL: ${data.url}`,
        {
          url: data.url,
          refresh_rate: data.refresh_rate
        }
      );
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
    <Card className="p-0">
      <WebsiteUrls
        urls={websiteUrls || []}
        isLoading={isLoading}
        onAdd={addWebsiteUrl}
        onDelete={deleteWebsiteUrl}
        isClientView={isClientView}
        isAdding={addWebsiteUrlMutation.isPending}
        isDeleting={deleteWebsiteUrlMutation.isPending}
        agentName="AI Assistant"
      />
    </Card>
  );
};
