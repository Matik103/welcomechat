
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useWebsiteUrls } from '@/hooks/useWebsiteUrls';
import { WebsiteUrlFormData } from '@/types/website-url';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { ValidationResult } from '@/types/website-url';
import { supabase } from '@/integrations/supabase/client';

interface WebsiteResourcesSectionProps {
  clientId: string;
  agentName: string;
  isClientView?: boolean;
}

export const WebsiteResourcesSection = ({
  clientId,
  agentName,
  isClientView = false,
}: WebsiteResourcesSectionProps) => {
  const [addingUrl, setAddingUrl] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [refreshRate, setRefreshRate] = useState<number>(30);
  const [validatingUrl, setValidatingUrl] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
  } = useWebsiteUrls(clientId);

  // Set up real-time subscription for website URLs
  useEffect(() => {
    if (!clientId) return;
    
    console.log(`Setting up real-time subscription for website_urls table for client ${clientId}...`);
    
    const channel = supabase
      .channel(`website_urls_${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'website_urls',
          filter: `client_id=eq.${clientId}`
        },
        (payload) => {
          console.log("Real-time website URL update received:", payload);
        }
      )
      .subscribe();
      
    return () => {
      console.log("Removing real-time website URLs subscription");
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const validateUrl = async (url: string): Promise<ValidationResult> => {
    setValidatingUrl(true);
    try {
      // Simulate a validation process (replace with actual validation logic)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const result: ValidationResult = {
        isValid: true,
        message: "URL validated successfully",
        status: 'success'
      };
      setValidationResult(result);
      return result;
    } catch (error) {
      console.error('Error validating URL:', error);
      const errorResult: ValidationResult = {
        isValid: false,
        message: 'Failed to validate URL',
        status: 'error'
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setValidatingUrl(false);
    }
  };

  const handleAddWebsiteUrl = async () => {
    if (!newUrl) {
      toast.error("URL cannot be empty.");
      return;
    }

    setAddingUrl(true);
    try {
      const validation = await validateUrl(newUrl);
      if (!validation.isValid) {
        toast.error(validation.message);
        return;
      }

      const data: WebsiteUrlFormData = {
        url: newUrl,
        refresh_rate: refreshRate,
      };
      await addWebsiteUrlMutation.mutateAsync(data);
      setNewUrl('');
      toast.success("URL added successfully.");
    } catch (error) {
      console.error('Error adding website URL:', error);
      toast.error("Failed to add website URL.");
    } finally {
      setAddingUrl(false);
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    setDeletingUrl(true);
    try {
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      toast.success("URL deleted successfully.");
    } catch (error) {
      console.error('Error deleting website URL:', error);
      toast.error("Failed to delete website URL.");
    } finally {
      setDeletingUrl(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Website URLs</CardTitle>
        <CardDescription>
          Manage the website URLs associated with this client.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 grid-cols-2">
          <Input
            type="url"
            placeholder="Add a new website URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={addingUrl}
          />
          <Input
            type="number"
            placeholder="Refresh Rate (minutes)"
            value={refreshRate.toString()}
            onChange={(e) => setRefreshRate(Number(e.target.value))}
            disabled={addingUrl}
          />
          <Button onClick={handleAddWebsiteUrl} disabled={addingUrl}>
            {addingUrl ? (
              <>
                Adding <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              <>
                Add URL <Plus className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>

        {websiteUrls && websiteUrls.length > 0 ? (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Current URLs</h3>
            <ul className="space-y-2">
              {websiteUrls.map((url) => (
                <li key={url.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate">{url.url}</p>
                    <p className="text-xs text-gray-500">
                      Refresh: {url.refresh_rate || 30} minutes
                      {url.last_crawled && ` • Last updated: ${new Date(url.last_crawled).toLocaleString()}`}
                    </p>
                    {url.status && (
                      <p className={`text-xs ${url.status === 'completed' ? 'text-green-500' : url.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>
                        Status: {url.status.charAt(0).toUpperCase() + url.status.slice(1)}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteWebsiteUrl(url.id)}
                    disabled={deletingUrl}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No website URLs added yet.</p>
        )}
      </CardContent>
    </Card>
  );
};
