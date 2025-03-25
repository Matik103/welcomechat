import { supabase } from './src/integrations/supabase/client.js';
import { DocumentProcessingService } from './src/services/documentProcessingService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDocumentUpload() {
  try {
    console.log('Starting document upload test...');
    
    // Initialize the document processing service
    const documentService = new DocumentProcessingService();
    
    // Test file path - you'll need to provide a test PDF file
    const testFilePath = path.join(__dirname, 'test-documents', 'test.pdf');
    
    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
      console.error('Test file not found. Please create a test PDF file at:', testFilePath);
      return;
    }
    
    // Read the test file
    const fileBuffer = fs.readFileSync(testFilePath);
    const fileName = path.basename(testFilePath);
    
    console.log('Uploading test document:', fileName);
    
    // Upload the document
    const uploadResult = await documentService.uploadDocument(fileBuffer, fileName);
    
    if (uploadResult.success) {
      console.log('Document uploaded successfully!');
      console.log('Document ID:', uploadResult.documentId);
      console.log('File path:', uploadResult.filePath);
      
      // Start document processing
      console.log('Starting document processing...');
      const processingResult = await documentService.processDocument(uploadResult.documentId);
      
      if (processingResult.success) {
        console.log('Document processing started successfully!');
        console.log('Processing ID:', processingResult.processingId);
      } else {
        console.error('Failed to start document processing:', processingResult.error);
      }
    } else {
      console.error('Failed to upload document:', uploadResult.error);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testDocumentUpload();
