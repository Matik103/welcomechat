
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { WebsiteUrlFormData } from '@/types/website-url';

interface WebsiteUrlFormProps {
  onSubmit: (data: WebsiteUrlFormData) => Promise<void>;
  isSubmitting?: boolean;
  agentName: string;
  clientId?: string;
  onAddSuccess?: () => Promise<any>;
  webstoreHook?: { isAdding: boolean };
  // Add both for compatibility
  onAdd?: (data: WebsiteUrlFormData) => Promise<void>;
  isAdding?: boolean;
}

export const WebsiteUrlForm: React.FC<WebsiteUrlFormProps> = ({
  onSubmit,
  onAdd,
  isSubmitting,
  isAdding,
  agentName,
  clientId,
  onAddSuccess,
  webstoreHook
}) => {
  const [newUrl, setNewUrl] = useState('');
  const [refreshRate, setRefreshRate] = useState(30); // Default 30 days
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUrl) {
      toast.error('Please enter a valid URL');
      return;
    }
    
    try {
      setIsValidating(true);
      // Attempt to validate URL
      let url = newUrl;
      
      // Add https:// if not present
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = `https://${url}`;
      }
      
      try {
        // Validate URL format
        new URL(url);
      } catch (error) {
        toast.error('Please enter a valid URL');
        setIsValidating(false);
        return;
      }

      // Support both callback patterns
      if (onAdd) {
        await onAdd({ 
          url, 
          refresh_rate: refreshRate
        });
      } else {
        await onSubmit({ 
          url, 
          refresh_rate: refreshRate
        });
      }
      
      setNewUrl('');
      
      if (onAddSuccess) {
        await onAddSuccess();
      }
    } catch (error) {
      console.error('Error adding URL:', error);
      toast.error('Failed to add website URL');
    } finally {
      setIsValidating(false);
    }
  };

  const isAddingUrl = isSubmitting || isAdding || (webstoreHook && webstoreHook.isAdding) || false;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">Add Website URL</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="url"
            placeholder="https://example.com"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            disabled={isAddingUrl || isValidating}
            className="flex-1"
          />
          <Input
            id="refresh_rate"
            type="number"
            min="1"
            placeholder="Refresh days"
            value={refreshRate}
            onChange={(e) => setRefreshRate(Number(e.target.value))}
            disabled={isAddingUrl || isValidating}
            className="w-full sm:w-32"
          />
          <Button type="submit" disabled={isAddingUrl || !newUrl || isValidating}>
            {isAddingUrl || isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isValidating ? "Validating..." : "Adding..."}
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Add
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {agentName} will refresh content from this website every {refreshRate} days.
        </p>
      </div>
    </form>
  );
};
