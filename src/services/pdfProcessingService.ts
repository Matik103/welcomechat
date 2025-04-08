import { supabase } from '@/integrations/supabase/client';
import { RAPIDAPI_KEY, RAPIDAPI_HOST, PDF_PROCESSING } from '@/config/env';
import { Database, Json } from '@/types/supabase';

// Constants for file size limits and processing
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

type ProcessingStatus = Database['public']['Tables']['document_processing_logs']['Row']['status'];

interface ProcessingOptions {
  useOCR?: boolean;
  language?: string;
  quality?: 'low' | 'medium' | 'high';
  timeout?: number;
}

interface ProcessingMetadata {
  fileName: string;
  fileSize: number;
  pageCount: number;
  processingTime: number;
  extractionMethod: string;
  chunks?: number;
  processingMethod: string;
  options: ProcessingOptions;
  timestamp: string;
  errorDetails?: any;
  storage_path?: string;
  storage_url?: string;
}

interface ProcessingLogEntry {
  document_id: string;
  status: ProcessingStatus;
  metadata: ProcessingMetadata;
  created_at?: string;
  updated_at?: string;
}

export interface PDFProcessingResult {
  success: boolean;
  documentId?: string;
  error?: string;
  extractedText?: string;
  metadata?: ProcessingMetadata;
}

type ProcessingStatusUpdate = {
  status: ProcessingStatus;
  progress?: number;
  error?: string;
};

export class PDFProcessingService {
  private static instance: PDFProcessingService;
  private processingStatuses: Map<string, ProcessingStatusUpdate> = new Map();
  private abortControllers: Map<string, AbortController> = new Map();

  private constructor() {}

  static getInstance(): PDFProcessingService {
    if (!PDFProcessingService.instance) {
      PDFProcessingService.instance = new PDFProcessingService();
    }
    return PDFProcessingService.instance;
  }

  /**
   * Cancel ongoing processing for a document
   */
  cancelProcessing(documentId: string) {
    const controller = this.abortControllers.get(documentId);
    if (controller) {
      controller.abort();
      this.abortControllers.delete(documentId);
      this.updateProcessingStatus(documentId, { 
        status: 'error', 
        error: 'Processing cancelled by user' 
      });
    }
  }

  /**
   * Process a PDF file with enhanced error handling and fallback methods
   */
  async processPDF(
    clientId: string,
    file: File,
    options: ProcessingOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<PDFProcessingResult> {
    const documentId = crypto.randomUUID();
    const controller = new AbortController();
    this.abortControllers.set(documentId, controller);
    
    try {
      console.log(`Starting PDF processing for ${file.name} (${file.size} bytes)`);
      
      // Validate file
      await this.validateFile(file);
      
      // Update status to pending
      this.updateProcessingStatus(documentId, { 
        status: 'pending',
        progress: 0
      });

      // Upload to Supabase
      const { filePath, publicUrl } = await this.uploadToStorage(clientId, documentId, file);
      
      // Update status to processing
      this.updateProcessingStatus(documentId, { 
        status: 'processing',
        progress: 30 
      });

      // Try multiple processing methods
      const processingMethods = [
        this.processWithRapidAPI.bind(this),
        this.processWithOCR.bind(this),
        this.processWithFallback.bind(this)
      ];

      let extractedText: string | null = null;
      let error: Error | null = null;
      let successfulMethod: string = '';
      const startTime = Date.now();

      for (const method of processingMethods) {
        try {
          console.log(`Attempting extraction with ${method.name}`);
          extractedText = await method(file, options, controller.signal);
          if (extractedText && extractedText.trim().length > 0) {
            successfulMethod = method.name;
            break;
          }
        } catch (e) {
          error = e;
          console.error(`Method ${method.name} failed:`, e);
          continue;
        }
      }

      if (!extractedText) {
        throw error || new Error('All processing methods failed');
      }

      // Store results in Supabase
      const processingTime = Date.now() - startTime;
      const metadata: ProcessingMetadata = {
        fileName: file.name,
        fileSize: file.size,
        pageCount: this.countPages(extractedText),
        processingTime,
        processingMethod: successfulMethod,
        extractionMethod: successfulMethod,
        options,
        timestamp: new Date().toISOString()
      };

      await this.storeResults(documentId, clientId, extractedText, filePath, publicUrl, metadata);

      this.updateProcessingStatus(documentId, { 
        status: 'completed',
        progress: 100 
      });

      return {
        success: true,
        documentId,
        extractedText,
        metadata
      };

    } catch (error) {
      console.error('PDF processing failed:', error);
      
      const errorMetadata: ProcessingMetadata = {
        fileName: file.name,
        fileSize: file.size,
        pageCount: 0,
        processingTime: 0,
        processingMethod: 'failed',
        extractionMethod: 'failed',
        options: options,
        timestamp: new Date().toISOString(),
        errorDetails: {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      };

      await this.logError(documentId, errorMetadata);
      
      this.updateProcessingStatus(documentId, { 
        status: 'error',
        error: error.message 
      });

      return {
        success: false,
        error: error.message,
        metadata: errorMetadata
      };
    } finally {
      this.abortControllers.delete(documentId);
    }
  }

  /**
   * Validate the PDF file
   */
  private async validateFile(file: File): Promise<void> {
    if (!file.type.includes('pdf')) {
      throw new Error('Invalid file type. Only PDF files are supported.');
    }

    if (file.size === 0) {
      throw new Error('File is empty.');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Check if file is readable
    try {
      const slice = await file.slice(0, 5).text();
      if (!slice.includes('%PDF')) {
        throw new Error('Invalid PDF file format');
      }
    } catch (error) {
      throw new Error('Could not read PDF file: ' + error.message);
    }
  }

  /**
   * Upload file to Supabase storage
   */
  private async uploadToStorage(
    clientId: string,
    documentId: string,
    file: File
  ): Promise<{ filePath: string; publicUrl: string }> {
    const filePath = `${clientId}/${documentId}/${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from('client_documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('client_documents')
      .getPublicUrl(filePath);

    return { filePath, publicUrl };
  }

  /**
   * Process with RapidAPI
   */
  private async processWithRapidAPI(
    file: File,
    options: ProcessingOptions,
    signal?: AbortSignal
  ): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('language', options.language || 'eng');
      formData.append('ocr', (options.useOCR ?? true).toString());
      formData.append('quality', options.quality || 'high');
      
      const controller = new AbortController();
      if (options.timeout) {
        setTimeout(() => controller.abort(), options.timeout);
      }

      const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
        method: 'POST',
        headers: {
          'x-rapidapi-host': RAPIDAPI_HOST,
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-pdf-optimization': 'high',
          'x-processing-priority': 'high'
        },
        body: formData,
        signal: options.timeout ? controller.signal : signal
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const text = await response.text();
      if (!text || text.trim().length === 0) {
        throw new Error('API returned empty text content');
      }

      return text;
    } catch (error) {
      console.error('RapidAPI processing failed:', error);
      throw error;
    }
  }

  /**
   * Process with OCR (fallback method)
   */
  private async processWithOCR(
    file: File,
    options: ProcessingOptions,
    signal?: AbortSignal
  ): Promise<string | null> {
    // Implement OCR processing logic here
    // This could be another API service or local processing
    throw new Error('OCR processing not implemented');
  }

  /**
   * Process with basic fallback method
   */
  private async processWithFallback(
    file: File,
    options: ProcessingOptions,
    signal?: AbortSignal
  ): Promise<string | null> {
    // Implement basic text extraction
    // This could be a simple PDF.js implementation
    throw new Error('Fallback processing not implemented');
  }

  /**
   * Store processing results in Supabase
   */
  private async storeResults(
    documentId: string,
    clientId: string,
    content: string,
    filePath: string,
    publicUrl: string,
    metadata: ProcessingMetadata
  ): Promise<void> {
    const { error } = await supabase
      .from('document_content')
      .insert({
        document_id: documentId,
        client_id: clientId,
        content,
        filename: metadata.fileName,
        file_type: 'application/pdf',
        metadata: JSON.parse(JSON.stringify(metadata)) as Json,
        created_at: new Date().toISOString()
      });

    if (error) {
      throw new Error(`Failed to store results: ${error.message}`);
    }
  }

  /**
   * Log error details to Supabase
   */
  private async logError(documentId: string, errorDetails: ProcessingMetadata): Promise<void> {
    try {
      const { error } = await supabase
        .from('document_processing_logs')
        .insert({
          document_id: documentId,
          status: 'error' as ProcessingStatus,
          metadata: JSON.parse(JSON.stringify(errorDetails)) as Json,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Failed to log error:', error);
      }
    } catch (error) {
      console.error('Failed to log error:', error);
    }
  }

  /**
   * Get the current processing status for a document
   */
  getProcessingStatus(documentId: string): ProcessingStatusUpdate | null {
    return this.processingStatuses.get(documentId) || null;
  }

  /**
   * Update the processing status for a document
   */
  private updateProcessingStatus(documentId: string, status: ProcessingStatusUpdate): void {
    this.processingStatuses.set(documentId, status);
  }

  /**
   * Clean up processing status for a document
   */
  clearProcessingStatus(documentId: string) {
    this.processingStatuses.delete(documentId);
  }

  private countPages(text: string): number {
    // Try different page detection methods
    const methods = [
      // Method 1: Look for "Page X" markers
      () => (text.match(/Page [0-9]+/g) || []).length,
      // Method 2: Look for page break markers
      () => (text.match(/\f/g) || []).length + 1,
      // Method 3: Estimate based on text length
      () => Math.ceil(text.length / 3000)
    ];

    for (const method of methods) {
      const count = method();
      if (count > 0) return count;
    }

    return 1; // Fallback to minimum
  }
} 