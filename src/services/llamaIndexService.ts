
import { supabase } from '@/integrations/supabase/client';
import { 
  LlamaIndexJobResponse, 
  LlamaIndexParsingResult, 
  LlamaIndexProcessingOptions 
} from '@/types/document-processing';

export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: LlamaIndexProcessingOptions = {}
): Promise<LlamaIndexJobResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.shouldUseAI !== undefined) {
      formData.append('use_ai', options.shouldUseAI.toString());
    }
    
    if (options.maxTokens !== undefined) {
      formData.append('max_tokens', options.maxTokens.toString());
    }
    
    if (options.temperature !== undefined) {
      formData.append('temperature', options.temperature.toString());
    }
    
    const response = await fetch(
      'https://mgjodiqecnnltsgorife.supabase.co/functions/v1/process-document',
      {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${supabase.auth.getSession() ? (await supabase.auth.getSession()).data.session?.access_token : ''}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload document to LlamaIndex: ${errorText}`);
    }
    
    const result: LlamaIndexJobResponse = await response.json();
    console.log('LlamaIndex job created:', result);
    return result;
  } catch (error) {
    console.error('Error uploading to LlamaIndex:', error);
    throw error;
  }
};

export const processLlamaIndexJob = async (
  jobId: string,
  maxAttempts = 10,
  delayMs = 3000
): Promise<LlamaIndexParsingResult> => {
  try {
    let attempts = 0;
    let result: LlamaIndexParsingResult | null = null;
    
    while (attempts < maxAttempts && (!result || (result.status !== 'SUCCEEDED' && result.status !== 'FAILED'))) {
      attempts++;
      
      console.log(`Checking LlamaIndex job status (attempt ${attempts}/${maxAttempts})...`);
      
      const response = await fetch(
        `https://mgjodiqecnnltsgorife.supabase.co/functions/v1/check-document-status?job_id=${jobId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${supabase.auth.getSession() ? (await supabase.auth.getSession()).data.session?.access_token : ''}`,
          },
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to check LlamaIndex job status: ${errorText}`);
      }
      
      result = await response.json();
      console.log(`LlamaIndex job status (${attempts}/${maxAttempts}):`, result);
      
      if (result.status === 'SUCCEEDED' || result.status === 'FAILED') {
        break;
      }
      
      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    if (!result) {
      throw new Error('Failed to process LlamaIndex job: No result returned');
    }
    
    return result;
  } catch (error) {
    console.error('Error processing LlamaIndex job:', error);
    throw error;
  }
};

export const convertToPdfIfNeeded = async (file: File): Promise<File> => {
  // For now, just return the original file
  // In the future, this could be implemented to convert various file types to PDF
  return file;
};
