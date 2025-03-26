
import { useState } from 'react';
import { Website, DocumentProcessingResult } from '@/types/document-processing';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export function useStoreWebsiteContent() {
  const [isStoring, setIsStoring] = useState(false);

  const storeWebsiteContent = async (website: Website, clientId: string): Promise<DocumentProcessingResult> => {
    if (!website || !clientId) {
      return {
        success: false,
        error: 'Missing website data or client ID'
      };
    }

    setIsStoring(true);

    try {
      // Create a processing record
      const processingId = uuidv4();
      
      // Store the URL in the document_processing table
      const { data, error } = await supabase
        .from('document_processing')
        .insert({
          id: processingId,
          document_url: website.url,
          client_id: clientId,
          agent_name: 'AI Assistant',
          document_type: 'website',
          status: 'pending',
          started_at: new Date().toISOString(),
          metadata: {
            websiteId: website.id,
            refresh_rate: website.refresh_rate || 30
          }
        })
        .select();

      if (error) {
        console.error('Error creating processing record:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // For the MVP, we'll just simulate success
      // In a real implementation, this would trigger a background job
      await supabase
        .from('document_processing')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          chunks: [{ content: `Content from ${website.url}` }]
        })
        .eq('id', processingId);

      // Update the website's last crawled date
      await supabase
        .from('website_urls')
        .update({
          last_crawled: new Date().toISOString()
        })
        .eq('id', website.id);

      return {
        success: true,
        urlsScraped: 1,
        contentStored: true
      };
    } catch (error) {
      console.error('Error storing website content:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsStoring(false);
    }
  };

  return {
    storeWebsiteContent,
    isStoring
  };
}
