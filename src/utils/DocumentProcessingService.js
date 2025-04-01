import { LlamaExtractionService } from './LlamaExtractionService.js';
import { supabase } from '../integrations/supabase/client.js';
import { supabaseService } from '../integrations/supabase/service-client.js';
import { convertWordToPdf, convertHtmlToPdf, splitPdfIntoChunks } from './documentConverters.js';

export class DocumentProcessingService {
  static EXTRACTION_AGENT_ID = '27ef6aaa-fcb5-4a2b-8d8c-be152ce89d90';
  
  // File size limits in bytes
  static MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  static MAX_CHUNK_SIZE = 10 * 1024 * 1024; // 10MB per chunk
  static MAX_PAGES_PER_CHUNK = 20; // Maximum pages per chunk

  /**
   * Process a document from file upload or URL
   */
  static async processDocument(fileOrUrl, documentType, clientId, agentName) {
    let jobData = null;

    try {
      let fileToProcess;
      let documentUrl;

      // Step 1: Handle input and upload to storage
      if (fileOrUrl instanceof File) {
        // Handle file upload
        fileToProcess = fileOrUrl;
        if (fileToProcess.size > this.MAX_FILE_SIZE) {
          throw new Error(`File size exceeds ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB limit`);
        }

        // Upload to document-storage bucket using service client
        const filePath = `${clientId}/${Date.now()}-${fileToProcess.name}`;
        const { error: uploadError } = await supabaseService.storage
          .from('document-storage')
          .upload(filePath, fileToProcess, {
            upsert: true,
            contentType: fileToProcess.type
          });

        if (uploadError) {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }

        // Get the public URL
        const { data: { publicUrl } } = supabaseService.storage
          .from('document-storage')
          .getPublicUrl(filePath);

        documentUrl = publicUrl;
      } else {
        // Handle URL input
        documentUrl = fileOrUrl;
        const response = await fetch(fileOrUrl);
        if (!response.ok) {
          throw new Error(`Failed to access URL: ${response.statusText}`);
        }
        
        const blob = await response.blob();
        if (blob.size > this.MAX_FILE_SIZE) {
          throw new Error(`File size exceeds ${Math.round(this.MAX_FILE_SIZE / 1024 / 1024)}MB limit`);
        }
        
        fileToProcess = new File([blob], 'document', { type: response.headers.get('content-type') || 'application/octet-stream' });
      }

      // Step 2: Create processing job record
      const { data, error: jobError } = await supabase
        .from('document_processing_jobs')
        .insert({
          client_id: clientId,
          agent_name: agentName,
          document_url: documentUrl,
          document_type: documentType,
          document_id: crypto.randomUUID(),
          status: 'processing',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (jobError) {
        throw new Error(`Failed to create job: ${jobError.message}`);
      }

      jobData = data;

      // Step 3: Convert to PDF if needed
      let pdfFile = fileToProcess;
      if (documentType === 'text') {
        const text = await fileToProcess.text();
        const pdfBuffer = await this.convertTextToPdf(text);
        pdfFile = new File([pdfBuffer], 'converted.pdf', { type: 'application/pdf' });
      } else if (documentType === 'docx') {
        const pdfBuffer = await convertWordToPdf(fileToProcess);
        pdfFile = new File([pdfBuffer], 'converted.pdf', { type: 'application/pdf' });
      }

      // Step 4: Process with LlamaParse
      const { id: fileId } = await LlamaExtractionService.uploadDocument(pdfFile);
      const extractionJob = await LlamaExtractionService.startExtractionJob(
        fileId,
        this.EXTRACTION_AGENT_ID
      );

      // Step 5: Get extraction result
      const extractionResult = await LlamaExtractionService.getExtractionResult(extractionJob.id);
      if (!extractionResult) {
        throw new Error('Extraction failed: No result returned');
      }

      return {
        success: true,
        jobId: jobData.id,
        content: extractionResult
      };

    } catch (error) {
      console.error('Document processing error:', error);

      if (jobData?.id) {
        await supabase
          .from('document_processing_jobs')
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', jobData.id);
      }

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Convert text to PDF
   */
  static async convertTextToPdf(text) {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            pre { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <pre>${text}</pre>
        </body>
      </html>
    `;
    return await convertHtmlToPdf(html);
  }

  // Helper methods
  static async getFileSize(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0; // If we can't determine size, proceed with caution
    }
  }

  static async processLargeFile(file) {
    if (file.size <= this.MAX_CHUNK_SIZE) {
      return [file];
    }

    // For PDF files, split by pages
    if (file.type === 'application/pdf') {
      return await splitPdfIntoChunks(file, this.MAX_PAGES_PER_CHUNK);
    }

    // For other files, split by size
    const chunks = [];
    let offset = 0;
    
    while (offset < file.size) {
      const chunk = file.slice(offset, offset + this.MAX_CHUNK_SIZE);
      chunks.push(new File([chunk], `chunk-${chunks.length + 1}`, { type: file.type }));
      offset += this.MAX_CHUNK_SIZE;
    }

    return chunks;
  }

  static combineResults(results) {
    if (results.length === 1) {
      return results[0];
    }

    // Combine the results based on their structure
    const combined = {
      personal_info: results[0].personal_info || {},
      summary: results.map(r => r.summary).filter(Boolean).join('\n\n'),
      experience: [],
      education: [],
      skills: new Set(),
      certifications: new Set()
    };

    // Combine arrays and sets from all chunks
    for (const result of results) {
      if (result.experience) combined.experience.push(...result.experience);
      if (result.education) combined.education.push(...result.education);
      if (result.skills) result.skills.forEach(skill => combined.skills.add(skill));
      if (result.certifications) result.certifications.forEach(cert => combined.certifications.add(cert));
    }

    // Convert sets back to arrays
    combined.skills = Array.from(combined.skills);
    combined.certifications = Array.from(combined.certifications);

    // Remove duplicates from arrays
    combined.experience = this.removeDuplicates(combined.experience, 'company');
    combined.education = this.removeDuplicates(combined.education, 'institution');

    return combined;
  }

  static removeDuplicates(array, key) {
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  static async updateJobStatus(jobId, status, additionalData = {}) {
    await supabase
      .from('document_processing_jobs')
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
  }

  static isPdfValid(file) {
    return file.type === 'application/pdf' && file.size > 0;
  }

  static async downloadFile(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const fileName = url.split('/').pop() || 'document';
    return new File([blob], fileName, { type: response.headers.get('content-type') || '' });
  }

  static async waitForExtraction(jobId, maxAttempts = 12) {
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      
      const result = await LlamaExtractionService.getExtractionResult(jobId);
      
      if (result.status !== 'PENDING') {
        return result;
      }
      
      attempts++;
    }
    
    throw new Error('Extraction timed out');
  }
} 