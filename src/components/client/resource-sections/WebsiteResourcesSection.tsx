import React, { useState } from 'react';
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
import { DataTableViewOptions } from '../data-table/data-table-view-options';
import { DataTable } from '../data-table/data-table';
import { columns } from '../data-table/columns/website-urls-column-def';
import { ValidationResult } from '@/types/website-url';
import { useToast } from '@/components/ui/use-toast';

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
  const { toast } = useToast();

  const {
    websiteUrls,
    isLoading: isLoadingUrls,
    addWebsiteUrlMutation,
    deleteWebsiteUrlMutation,
  } = useWebsiteUrls(clientId);

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
      toast({
        title: "Error",
        description: "URL cannot be empty.",
        variant: "destructive",
      });
      return;
    }

    setAddingUrl(true);
    try {
      const validation = await validateUrl(newUrl);
      if (!validation.isValid) {
        toast({
          title: "Error",
          description: validation.message,
          variant: "destructive",
        });
        return;
      }

      const data: WebsiteUrlFormData = {
        url: newUrl,
        refresh_rate: refreshRate,
      };
      await addWebsiteUrlMutation.mutateAsync(data);
      setNewUrl('');
      toast({
        title: "Success",
        description: "URL added successfully.",
      });
    } catch (error) {
      console.error('Error adding website URL:', error);
      toast({
        title: "Error",
        description: "Failed to add website URL.",
        variant: "destructive",
      });
    } finally {
      setAddingUrl(false);
    }
  };

  const handleDeleteWebsiteUrl = async (urlId: number) => {
    setDeletingUrl(true);
    try {
      await deleteWebsiteUrlMutation.mutateAsync(urlId);
      toast({
        title: "Success",
        description: "URL deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting website URL:', error);
      toast({
        title: "Error",
        description: "Failed to delete website URL.",
        variant: "destructive",
      });
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
          <DataTable
            columns={columns(isClientView, handleDeleteWebsiteUrl, deletingUrl)}
            data={websiteUrls?.map(url => ({
              ...url,
              refresh_rate: url.refresh_rate || 30,
              status: url.status as "pending" | "processing" | "completed" | "failed" | null
            })) || []}
            isLoading={isLoadingUrls}
          />
        ) : (
          <p>No website URLs added yet.</p>
        )}
      </CardContent>
    </Card>
  );
};
