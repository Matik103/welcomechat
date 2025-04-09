
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { WebsiteUrl } from '@/types/website-url';
import { supabase } from '@/integrations/supabase/client';

// This hook provides functionality for storing website content
export function useStoreWebsiteContent(clientId: string | undefined) {
  const [isProcessing, setIsProcessing] = useState(false);

  const storeWebsiteContent = useMutation({
    mutationFn: async (websiteUrl: WebsiteUrl) => {
      if (!clientId) {
        throw new Error("Client ID is required");
      }
      
      setIsProcessing(true);
      
      try {
        // Here we would typically call an API endpoint to process the website
        // For now, we're just updating the status in the database
        const { data, error } = await supabase
          .from('website_urls')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', websiteUrl.id)
          .eq('client_id', clientId)
          .select();
          
        if (error) throw error;
        
        // In a real implementation, we would kick off a background job here
        // or call an API endpoint to start the processing
        
        // For now, simulate a completed process after a delay
        setTimeout(async () => {
          const { error: updateError } = await supabase
            .from('website_urls')
            .update({
              status: 'completed',
              last_crawled: new Date().toISOString()
            })
            .eq('id', websiteUrl.id);
            
          if (updateError) {
            console.error("Error updating website status:", updateError);
          }
          
          setIsProcessing(false);
        }, 2000);
        
        return data;
      } catch (error) {
        console.error("Error processing website content:", error);
        setIsProcessing(false);
        throw error;
      }
    }
  });
  
  return {
    ...storeWebsiteContent,
    isProcessing
  };
}
