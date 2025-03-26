
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Website } from '@/types/website-url';

export function useStoreWebsiteContent() {
  const [isStoring, setIsStoring] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const storeWebsiteContent = async (website: Website) => {
    setIsStoring(true);
    setError(null);
    
    try {
      // Call the Supabase edge function to store website content
      const response = await fetch(`${supabase.supabaseUrl}/functions/v1/crawl-website`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabase.supabaseKey}`
        },
        body: JSON.stringify({
          url: website.url,
          client_id: website.client_id,
          website_id: website.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to store website content');
      }
      
      const result = await response.json();
      
      // Enhanced response for better feedback
      return {
        success: true,
        urlsScraped: result.urlsScraped || 0,
        contentStored: result.contentStored || 0
      };
    } catch (error) {
      console.error('Error storing website content:', error);
      setError(error as Error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    } finally {
      setIsStoring(false);
    }
  };
  
  return {
    storeWebsiteContent,
    isStoring,
    error
  };
}
