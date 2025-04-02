import { supabase } from '@/integrations/supabase/client';
import { 
  LlamaIndexJobResponse, 
  LlamaIndexParsingResult, 
  LlamaIndexProcessingOptions 
} from '@/types/document-processing';

const LLAMA_INDEX_API_URL = process.env.NEXT_PUBLIC_LLAMA_INDEX_API_URL || 'http://localhost:8000';

// Upload a document to LlamaIndex for processing
export const uploadDocumentToLlamaIndex = async (
  file: File,
  options: LlamaIndexProcessingOptions = {}
): Promise<LlamaIndexJobResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('use_ai', String(options.shouldUseAI ?? true));
    
    if (options.maxTokens) {
      formData.append('max_tokens', String(options.maxTokens));
    }
    if (options.temperature) {
      formData.append('temperature', String(options.temperature));
    }
    
    const response = await fetch(`${LLAMA_INDEX_API_URL}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error uploading to LlamaIndex:', errorText);
      throw new Error(`Failed to upload document to LlamaIndex: ${errorText}`);
    }
    
    const result: LlamaIndexJobResponse = await response.json();
    console.log('LlamaIndex upload result:', result);
    return result;
  } catch (error) {
    console.error('Error in uploadDocumentToLlamaIndex:', error);
    throw error;
  }
};

// Poll LlamaIndex for the processing status of a job
export const processLlamaIndexJob = async (jobId: string): Promise<LlamaIndexParsingResult> => {
  try {
    const response = await fetch(`${LLAMA_INDEX_API_URL}/parsing_result/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error getting LlamaIndex parsing result for job ${jobId}:`, errorText);
      throw new Error(`Failed to get LlamaIndex parsing result: ${errorText}`);
    }
    
    const result: LlamaIndexParsingResult = await response.json();
    console.log(`LlamaIndex parsing result for job ${jobId}:`, result);
    return result;
  } catch (error) {
    console.error(`Error in processLlamaIndexJob for job ${jobId}:`, error);
    throw error;
  }
};

// Convert a file to PDF if it's not already a PDF
export const convertToPdfIfNeeded = async (file: File): Promise<File> => {
  if (file.type === 'application/pdf') {
    return file;
  }
  
  try {
    // Use Supabase Edge Function to convert the document
    const convertResponse = await supabase.functions.invoke('convert-document', {
      body: {
        file_url: URL.createObjectURL(file),
        filename: file.name
      }
    });
    
    if (convertResponse.error) {
      console.error('Error converting document to PDF:', convertResponse.error);
      throw new Error(`Failed to convert document to PDF: ${convertResponse.error.message}`);
    }
    
    const { data: convertedData } = convertResponse;
    
    if (!convertedData || !convertedData.file) {
      throw new Error('Conversion to PDF failed: No file returned');
    }
    
    // Convert the base64 string to a Blob
    const base64Response = await fetch(`data:${convertedData.mime_type};base64,${convertedData.file}`);
    const pdfBlob = await base64Response.blob();
    
    // Create a new File object from the Blob
    const pdfFile = new File([pdfBlob], `${file.name.split('.')[0]}.pdf`, { type: 'application/pdf' });
    
    return pdfFile;
  } catch (error) {
    console.error('Error in convertToPdfIfNeeded:', error);
    throw error;
  }
};
