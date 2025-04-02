
import { 
  LlamaParseReader, 
  VectorStoreIndex,
  Document as LlamaDocument,
  storageContextFromDefaults
} from "llamaindex";
import { supabase } from "@/integrations/supabase/client";
import { convertWordToPdf, splitPdfIntoChunks } from "./documentConverters";
import { LLAMA_CLOUD_API_KEY } from "@/config/env";
import { DocumentProcessingResult, DocumentType } from "@/types/document-processing";
import { toast } from "sonner";
import { DOCUMENTS_BUCKET } from "./supabaseStorage";
import { google } from 'googleapis';
import axios from 'axios';

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
      
      // 1. Determine if this is a Google Drive URL
      const isGoogleDriveUrl = this.isGoogleDriveUrl(documentUrl);
      
      let documentData: Blob;
      let fileName: string;
      
      if (isGoogleDriveUrl) {
        // Handle Google Drive document
        const { data, filename } = await this.downloadGoogleDriveFile(documentUrl);
        documentData = new Blob([data]);
        fileName = filename || 'google-document.pdf';
      } else {
        // Regular URL - direct fetch
        const response = await fetch(documentUrl);
        if (!response.ok) {
          return {
            success: false,
            error: `Failed to fetch document: ${response.statusText}`,
            processed: 0,
            failed: 1
          };
        }
        
        documentData = await response.blob();
        fileName = documentUrl.split('/').pop() || 'document.pdf';
      }
      
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
   * Check if URL is from Google Drive
   * @param url The URL to check
   * @returns Whether the URL is a Google Drive URL
   */
  private static isGoogleDriveUrl(url: string): boolean {
    return url.includes('drive.google.com') || 
           url.includes('docs.google.com') || 
           url.includes('sheets.google.com') || 
           url.includes('slides.google.com');
  }
  
  /**
   * Download a file from Google Drive
   * @param url The Google Drive URL
   * @returns The file data and filename
   */
  private static async downloadGoogleDriveFile(url: string): Promise<{ data: Uint8Array, filename: string }> {
    try {
      // Extract the file ID from various Google URL formats
      let fileId = '';
      
      if (url.includes('drive.google.com/file/d/')) {
        // Format: https://drive.google.com/file/d/FILE_ID/view
        const match = url.match(/\/file\/d\/([^\/]+)/);
        if (match) fileId = match[1];
      } else if (url.includes('drive.google.com/open')) {
        // Format: https://drive.google.com/open?id=FILE_ID
        const match = url.match(/[?&]id=([^&]+)/);
        if (match) fileId = match[1];
      } else if (url.includes('docs.google.com') || 
                url.includes('sheets.google.com') || 
                url.includes('slides.google.com')) {
        // Format: https://docs.google.com/document/d/FILE_ID/edit
        const match = url.match(/\/d\/([^\/]+)/);
        if (match) fileId = match[1];
      }
      
      if (!fileId) {
        throw new Error('Could not extract file ID from Google Drive URL');
      }
      
      // Check if we need to use Google API (requiring authentication)
      // If we have a service account, we could use Google API here
      // For simplicity, we'll try direct download with the export format parameter
      
      // Determine if this is a Google Docs, Sheets, or Slides URL
      let exportFormat = '';
      if (url.includes('document')) {
        exportFormat = 'application/pdf';
      } else if (url.includes('spreadsheets')) {
        exportFormat = 'application/pdf';
      } else if (url.includes('presentation')) {
        exportFormat = 'application/pdf';
      }
      
      let downloadUrl = '';
      let filename = '';
      
      if (exportFormat) {
        // Google Docs/Sheets/Slides - export as PDF
        downloadUrl = `https://docs.google.com/document/d/${fileId}/export?format=pdf`;
        filename = `google-doc-${fileId}.pdf`;
      } else {
        // Regular Drive file - direct download
        downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        filename = `drive-file-${fileId}`;
      }
      
      // Try to get file metadata to determine actual name
      try {
        const metadataUrl = `https://drive.google.com/file/d/${fileId}/view`;
        const response = await axios.get(metadataUrl);
        const titleMatch = response.data.match(/<title>(.*?)<\/title>/);
        if (titleMatch && titleMatch[1]) {
          const cleanTitle = titleMatch[1].replace(' - Google Drive', '');
          if (cleanTitle) {
            filename = cleanTitle;
          }
        }
      } catch (metadataError) {
        console.log('Could not get file metadata, using default filename');
      }
      
      // Download the file
      const response = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
      
      return {
        data: new Uint8Array(response.data),
        filename: filename
      };
    } catch (error) {
      console.error('Error downloading Google Drive file:', error);
      throw new Error(`Failed to download Google Drive file: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    // Convert Excel to PDF (simplified approach - extract as text)
    if (fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        fileType === 'application/vnd.ms-excel' ||
        fileName.endsWith('.xlsx') || 
        fileName.endsWith('.xls')) {
      console.log('Converting Excel file to PDF (text extraction)');
      // For Excel, we'd need a specialized library like xlsx
      // For simplicity, we'll convert to text-based PDF
      const arrayBuffer = await file.arrayBuffer();
      // This is a placeholder - in a real implementation, 
      // use xlsx or similar library to extract text
      const text = `Content of Excel file: ${fileName}`;
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
      let extractedText = '';
      
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
            
            // Combine all document text
            for (const doc of chunkDocuments) {
              extractedText += doc.text + "\n\n";
            }
          }
          
          // Clean up the temporary URL
          URL.revokeObjectURL(tempFilePath);
        } catch (error) {
          console.error(`Error processing chunk ${i + 1}:`, error);
          failedChunks++;
        }
      }
      
      // 5. Save extracted data to database - both ai_agents and document_processing_jobs tables
      
      // Save to document_links table
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
      
      // Save to ai_agents table with the extracted text content
      const { data: aiAgentData, error: aiAgentError } = await supabase
        .from('ai_agents')
        .insert({
          client_id: clientId,
          content: extractedText,
          name: `Document: ${fileName}`,
          type: 'document',
          interaction_type: 'document',
          metadata: {
            document_url: documentUrl,
            file_name: fileName,
            processed_sections: documents.length,
            failed_sections: failedChunks
          }
        })
        .select()
        .single();
      
      if (aiAgentError) {
        console.error('Error saving to ai_agents:', aiAgentError);
      }
      
      // Save to document_processing_jobs table
      const { data: processingJobData, error: processingJobError } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          document_url: documentUrl,
          document_type: 'pdf',
          agent_name: `Document: ${fileName}`,
          status: 'completed',
          content: extractedText,
          document_id: documentLinkData?.id?.toString() || 'unknown',
          metadata: {
            file_name: fileName,
            processed_sections: documents.length,
            failed_sections: failedChunks
          }
        })
        .select()
        .single();
      
      if (processingJobError) {
        console.error('Error saving to document_processing_jobs:', processingJobError);
      }
      
      console.log(`Document processing complete. Processed ${documents.length} sections with ${failedChunks} failures`);
      
      return {
        success: true,
        processed: documents.length,
        failed: failedChunks,
        documentId: documentLinkData?.id?.toString(),
        documentUrl: documentUrl,
        extractedText: extractedText
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
