
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { DocumentLinkFormData } from '@/types/document-processing';

interface DocumentLinkFormProps {
  onSubmit: (data: DocumentLinkFormData) => Promise<void>;
  isSubmitting: boolean;
  agentName: string;
  clientId?: string;
}

export const DocumentLinkForm: React.FC<DocumentLinkFormProps> = ({
  onSubmit,
  isSubmitting,
  agentName,
  clientId
}) => {
  const [link, setLink] = useState('');
  const [refreshRate, setRefreshRate] = useState(30); // Default 30 days
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!link) {
      toast.error('Please enter a document link');
      return;
    }
    
    try {
      setIsValidating(true);
      
      // Basic validation
      let validLink = link;
      
      // Add https:// if not present
      if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
        validLink = `https://${validLink}`;
      }
      
      try {
        // Validate URL format
        new URL(validLink);
      } catch (error) {
        toast.error('Please enter a valid URL');
        setIsValidating(false);
        return;
      }
      
      // Submit the data
      await onSubmit({
        link: validLink,
        refresh_rate: refreshRate,
        document_type: 'google_drive' // Set default type
      });
      
      // Reset form on success
      setLink('');
    } catch (error) {
      console.error('Error adding document link:', error);
      toast.error('Failed to add document link');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="link">Add Document Link</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="link"
            placeholder="https://drive.google.com/file/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={isSubmitting || isValidating}
            className="flex-1"
          />
          <Input
            id="refresh_rate"
            type="number"
            min="1"
            placeholder="Refresh days"
            value={refreshRate}
            onChange={(e) => setRefreshRate(Number(e.target.value))}
            disabled={isSubmitting || isValidating}
            className="w-full sm:w-32"
          />
          <Button type="submit" disabled={isSubmitting || !link || isValidating}>
            {isSubmitting || isValidating ? (
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
          {agentName} will refresh this document every {refreshRate} days.
        </p>
      </div>
    </form>
  );
};

export default DocumentLinkForm;
