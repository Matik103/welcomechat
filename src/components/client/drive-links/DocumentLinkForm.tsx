
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export interface DocumentLinkFormProps {
  onSubmit: (data: { link: string; refresh_rate: number }) => Promise<void>;
  isSubmitting: boolean;
  agentName?: string;
}

export const DocumentLinkForm: React.FC<DocumentLinkFormProps> = ({
  onSubmit,
  isSubmitting,
  agentName = "AI Assistant"
}) => {
  const [link, setLink] = useState('');
  const [refreshRate, setRefreshRate] = useState(7); // Default 7 days

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!link) {
      toast.error('Please enter a Google Drive link');
      return;
    }
    
    try {
      await onSubmit({ 
        link, 
        refresh_rate: refreshRate
      });
      
      setLink('');
    } catch (error) {
      console.error('Error adding document link:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="link">Add Google Drive Link</Label>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            id="link"
            placeholder="https://drive.google.com/file/d/..."
            value={link}
            onChange={(e) => setLink(e.target.value)}
            disabled={isSubmitting}
            className="flex-1"
          />
          <Input
            id="refresh_rate"
            type="number"
            min="1"
            placeholder="Refresh days"
            value={refreshRate}
            onChange={(e) => setRefreshRate(Number(e.target.value))}
            disabled={isSubmitting}
            className="w-full sm:w-32"
          />
          <Button type="submit" disabled={isSubmitting || !link}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
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
          {agentName} will refresh content from this document every {refreshRate} days.
        </p>
      </div>
    </form>
  );
};
