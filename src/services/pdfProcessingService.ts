
import { supabase } from '@/integrations/supabase/client';
import { RAPIDAPI_KEY, RAPIDAPI_HOST } from '@/config/env';
import { toast } from 'sonner';

export interface ProcessPdfResult {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Service for processing PDF documents
 */
export const pdfProcessingService = {
  /**
   * Extract text from a PDF file using RapidAPI
   */
  extractText: async (file: File): Promise<ProcessPdfResult> => {
    try {
      if (file.type !== 'application/pdf') {
        return {
          success: false,
          error: 'File is not a PDF'
        };
      }
      
      // Get RapidAPI key either from environment or Supabase secrets
      let apiKey = RAPIDAPI_KEY;
      
      if (!apiKey) {
        // Try to get the key from Supabase secrets
        try {
          const { data: secrets, error: secretsError } = await supabase.functions.invoke('get-secrets', {
            body: { keys: ['VITE_RAPIDAPI_KEY'] }
          });
          
          if (secretsError || !secrets?.VITE_RAPIDAPI_KEY) {
            return {
              success: false,
              error: 'RapidAPI key is not configured. Please set it up in the admin section.'
            };
          }
          
          apiKey = secrets.VITE_RAPIDAPI_KEY;
        } catch (error) {
          console.error("Error retrieving API key from secrets:", error);
          return {
            success: false,
            error: 'Failed to retrieve RapidAPI key from secrets'
          };
        }
      }
      
      // Process the PDF with RapidAPI
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
        method: 'POST',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': apiKey
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF extraction API error:', response.status, errorText);
        return {
          success: false,
          error: `PDF extraction failed with status ${response.status}: ${errorText}`
        };
      }
      
      const extractedText = await response.text();
      
      return {
        success: true,
        text: extractedText
      };
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during PDF text extraction'
      };
    }
  }
};
