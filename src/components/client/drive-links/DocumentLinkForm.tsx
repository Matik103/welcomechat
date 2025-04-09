
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { DocumentLinkFormData } from '@/types/document-processing';

interface DocumentLinkFormProps {
  onSubmit: (data: DocumentLinkFormData) => Promise<void>;
  isSubmitting?: boolean;
  agentName?: string;
}

export function DocumentLinkForm({
  onSubmit,
  isSubmitting = false,
  agentName = 'AI Assistant'
}: DocumentLinkFormProps) {
  const [link, setLink] = useState('');
  const [refreshRate, setRefreshRate] = useState(7); // Default 7 days

  const validateLink = (link: string): boolean => {
    // Simple validation for Google Drive links
    return link.includes('drive.google.com') || 
           link.includes('docs.google.com') || 
           link.includes('sheets.google.com') || 
           link.includes('slides.google.com');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateLink(link)) {
      alert('Please enter a valid Google Drive link');
      return;
    }
    
    try {
      await onSubmit({
        link,
        refresh_rate: refreshRate,
        document_type: 'google_drive'
      });
      
      // Clear form after successful submission
      setLink('');
    } catch (error) {
      console.error('Error submitting document link:', error);
      // Error will be handled by the parent component
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="google-link">Google Drive Link</Label>
        <Input
          id="google-link"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://drive.google.com/... or https://docs.google.com/..."
          required
        />
        <p className="text-xs text-muted-foreground">
          Enter a Google Drive folder, Doc, Sheet, or Slides URL
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="refresh-rate">Refresh Rate (days)</Label>
        <Input
          id="refresh-rate"
          type="number"
          min="1"
          max="90"
          value={refreshRate}
          onChange={(e) => setRefreshRate(parseInt(e.target.value) || 7)}
        />
        <p className="text-xs text-muted-foreground">
          How often the content should be refreshed
        </p>
      </div>
      
      <Button 
        type="submit" 
        disabled={isSubmitting || !link}
        className="w-full sm:w-auto"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding...
          </>
        ) : (
          'Add Document'
        )}
      </Button>
    </form>
  );
}
