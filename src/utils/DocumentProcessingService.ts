
import { 
  LlamaParseReader, 
  VectorStoreIndex,
  Document as LlamaDocument,
  storageContextFromDefaults
} from "llamaindex";
import { supabase } from "@/integrations/supabase/client";
import { convertWordToPdf, splitPdfIntoChunks } from "./documentConverters";
import { LLAMA_CLOUD_API_KEY } from "@/config/env";
import { DocumentProcessingResult } from "@/types/document-processing";
import { toast } from "sonner";
import { DOCUMENTS_BUCKET } from "./supabaseStorage";

export class DocumentProcessingService {
  /**
   * Process a document using LlamaIndex
   * @param file The file to process
   * @param clientId The client ID
   * @returns Processing result
   */
  static async processDocument(
    file: File,
    clientId: string
  ): Promise<DocumentProcessingResult> {
    try {
      console.log(`Processing document for client ${clientId}:`, file.name);
      
      // 1. Convert the document to PDF if needed
      const pdfData = await this.convertToPdf(file);
      
      // 2. Upload the PDF to Supabase storage
      const filePath = `${clientId}/${Date.now()}_${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(filePath, pdfData, {
          contentType: 'application/pdf',
          upsert: false
        });
      
      if (uploadError) {
        console.error('Error uploading PDF to storage:', uploadError);
        return {
          success: false,
          error: `Failed to upload PDF: ${uploadError.message}`,
          processed: 0,
          failed: 1
        };
      }
      
      // 3. Get the public URL of the uploaded PDF
      const { data: publicUrlData } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .getPublicUrl(filePath);
      
      if (!publicUrlData || !publicUrlData.publicUrl) {
        return {
          success: false,
          error: 'Failed to get public URL for uploaded PDF',
          processed: 0,
          failed: 1
        };
      }
      
      // 4. Process the PDF with LlamaIndex
      const result = await this.processWithLlamaIndex(
        pdfData,
        clientId,
        publicUrlData.publicUrl,
        file.name
      );
      
      return result;
    } catch (error) {
      console.error('Error in processDocument:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing document',
        processed: 0,
        failed: 1
      };
    }
  }
  
  /**
   * Process a document URL using LlamaIndex
   * @param documentUrl The document URL
   * @param clientId The client ID
   * @returns Processing result
   */
  static async processDocumentUrl(
    documentUrl: string,
    clientId: string
  ): Promise<DocumentProcessingResult> {
    try {
      console.log(`Processing document URL for client ${clientId}:`, documentUrl);
      
      // 1. Fetch the document
      const response = await fetch(documentUrl);
      if (!response.ok) {
        return {
          success: false,
          error: `Failed to fetch document: ${response.statusText}`,
          processed: 0,
          failed: 1
        };
      }
      
      const documentData = await response.blob();
      const fileName = documentUrl.split('/').pop() || 'document.pdf';
      
      // 2. Create a File object from the blob
      const file = new File([documentData], fileName, { 
        type: documentData.type || 'application/pdf' 
      });
      
      // 3. Process the file
      return await this.processDocument(file, clientId);
    } catch (error) {
      console.error('Error in processDocumentUrl:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing document URL',
        processed: 0,
        failed: 1
      };
    }
  }
  
  /**
   * Convert a document to PDF
   * @param file The file to convert
   * @returns PDF data as Uint8Array
   */
  private static async convertToPdf(file: File): Promise<Uint8Array> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    
    console.log(`Converting file to PDF: ${fileName} (${fileType})`);
    
    // Check if the file is already a PDF
    if (fileType === 'application/pdf') {
      console.log('File is already a PDF, no conversion needed');
      return new Uint8Array(await file.arrayBuffer());
    }
    
    // Convert Word document to PDF
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileType === 'application/msword' ||
        fileName.endsWith('.docx') || 
        fileName.endsWith('.doc')) {
      console.log('Converting Word document to PDF');
      return await convertWordToPdf(file);
    }
    
    // Convert text file to PDF (simple text extraction)
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      console.log('Converting text file to PDF');
      const text = await file.text();
      return await this.textToPdf(text);
    }
    
    // Convert CSV to PDF
    if (fileType === 'text/csv' || fileName.endsWith('.csv')) {
      console.log('Converting CSV file to PDF');
      const text = await file.text();
      return await this.textToPdf(text);
    }
    
    // For unsupported types, throw an error
    throw new Error(`Unsupported file type: ${fileType}`);
  }
  
  /**
   * Convert text to PDF
   * @param text The text to convert
   * @returns PDF data as Uint8Array
   */
  private static async textToPdf(text: string): Promise<Uint8Array> {
    // Use HTML as an intermediate format
    const html = `<html><body><pre>${text}</pre></body></html>`;
    
    // Use the HTML to PDF converter
    const { convertHtmlToPdf } = await import('./documentConverters');
    return await convertHtmlToPdf(html);
  }
  
  /**
   * Process a PDF with LlamaIndex
   * @param pdfData The PDF data
   * @param clientId The client ID
   * @param documentUrl The document URL
   * @param fileName The file name
   * @returns Processing result
   */
  private static async processWithLlamaIndex(
    pdfData: Uint8Array,
    clientId: string,
    documentUrl: string,
    fileName: string
  ): Promise<DocumentProcessingResult> {
    try {
      console.log('Processing PDF with LlamaIndex');
      
      // 1. Get API keys from Supabase secrets or environment variables
      let llamaCloudApiKey = LLAMA_CLOUD_API_KEY;
      
      if (!llamaCloudApiKey) {
        // Try to get API keys from Supabase Edge Function
        try {
          const { data: secretsData, error: secretsError } = await supabase.functions.invoke('get-secrets', {
            body: { keys: ['LLAMA_CLOUD_API_KEY'] }
          });
          
          if (!secretsError && secretsData && secretsData.LLAMA_CLOUD_API_KEY) {
            llamaCloudApiKey = secretsData.LLAMA_CLOUD_API_KEY;
          }
        } catch (error) {
          console.error('Error getting secrets from Supabase:', error);
        }
      }
      
      if (!llamaCloudApiKey) {
        console.warn('No LLAMA_CLOUD_API_KEY found, document processing may fail');
      }
      
      // 2. Set up LlamaIndex reader with API key
      const reader = new LlamaParseReader({ 
        apiKey: llamaCloudApiKey,
        resultType: "markdown" 
      });
      
      // 3. Split PDF into chunks if it's too large
      const pdfChunks = await splitPdfIntoChunks(pdfData);
      console.log(`Split PDF into ${pdfChunks.length} chunks`);
      
      // 4. Process each chunk
      const documents: LlamaDocument[] = [];
      let failedChunks = 0;
      
      for (let i = 0; i < pdfChunks.length; i++) {
        try {
          console.log(`Processing chunk ${i + 1}/${pdfChunks.length}`);
          
          // Create a blob from the PDF chunk
          const blob = new Blob([pdfChunks[i]], { type: 'application/pdf' });
          
          // Use the correct method from LlamaParseReader to load the PDF data
          // Using loadData with the blob
          const file = new File([blob], `chunk-${i+1}.pdf`, { type: 'application/pdf' });
          const tempFilePath = URL.createObjectURL(file);
          const chunkDocuments = await reader.loadData(tempFilePath);
          
          if (chunkDocuments && chunkDocuments.length > 0) {
            documents.push(...chunkDocuments);
          }
          
          // Clean up the temporary URL
          URL.revokeObjectURL(tempFilePath);
        } catch (error) {
          console.error(`Error processing chunk ${i + 1}:`, error);
          failedChunks++;
        }
      }
      
      // 5. Save extracted data to database (simplified for this implementation)
      const { data: documentLinkData, error: documentLinkError } = await supabase
        .from('document_links')
        .insert({
          client_id: clientId,
          link: documentUrl,
          document_type: 'pdf',
          file_name: fileName,
          storage_path: documentUrl.split('/').pop(),
          mime_type: 'application/pdf'
        })
        .select()
        .single();
      
      if (documentLinkError) {
        console.error('Error saving document link:', documentLinkError);
      }
      
      console.log(`Document processing complete. Processed ${documents.length} sections with ${failedChunks} failures`);
      
      return {
        success: true,
        processed: documents.length,
        failed: failedChunks,
        documentId: documentLinkData?.id?.toString(),
        documentUrl: documentUrl
      };
    } catch (error) {
      console.error('Error in processWithLlamaIndex:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error processing with LlamaIndex',
        processed: 0,
        failed: 1
      };
    }
  }
}
