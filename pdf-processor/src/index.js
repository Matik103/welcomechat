
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import FormData from 'form-data';

dotenv.config();

const app = express();
let port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// RapidAPI configuration
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '109e60ef56msh033c6355bf5052cp149673jsnec27c0641c4d';
const RAPIDAPI_HOST = 'pdf-to-text-converter.p.rapidapi.com';
const RAPIDAPI_URL = 'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert';

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const DOCUMENTS_BUCKET = 'client_documents';

async function downloadPDFFromStorage(storagePath) {
  console.log('Downloading PDF from:', storagePath);
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .download(storagePath);

  if (error) {
    console.error('Download error:', error);
    throw new Error(`Failed to download PDF: ${error.message}`);
  }

  if (!data) {
    throw new Error('No data received from storage');
  }

  console.log('PDF downloaded successfully, size:', data.size);
  return Buffer.from(await data.arrayBuffer());
}

async function convertPDFToText(pdfBuffer, pageNumber = null) {
  console.log('Converting PDF to text using RapidAPI...');
  console.log('PDF buffer size:', pdfBuffer.length);
  
  try {
    // Create form data for the API request
    const formData = new FormData();
    
    // Append the PDF file to the form data
    formData.append('file', pdfBuffer, {
      filename: 'document.pdf',
      contentType: 'application/pdf',
    });
    
    console.log('FormData created with file');
    
    // Add page parameter if specified
    if (pageNumber) {
      console.log('Processing specific page:', pageNumber);
      formData.append('page', pageNumber);
    }
    
    console.log('Sending request to RapidAPI:', RAPIDAPI_URL);
    console.log('Using headers:', {
      'x-rapidapi-key': `${RAPIDAPI_KEY.substring(0, 5)}...`,
      'x-rapidapi-host': RAPIDAPI_HOST
    });
    
    // Make the API request
    const response = await axios({
      method: 'post',
      url: RAPIDAPI_URL,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        ...formData.getHeaders()
      },
      data: formData,
      timeout: 30000 // 30 second timeout
    });
    
    console.log('RapidAPI response status:', response.status);
    
    if (response.status === 200) {
      console.log('PDF conversion successful');
      console.log('Response data structure:', Object.keys(response.data));
      
      // Handle both response formats from the API
      const extractedText = response.data.text || 
                           (typeof response.data === 'string' ? response.data : JSON.stringify(response.data));
      
      console.log('Extracted text length:', extractedText.length);
      console.log('Text preview:', extractedText.substring(0, 100) + '...');
      
      return {
        success: true,
        text: extractedText,
        metadata: {
          extraction_method: 'rapidapi',
          timestamp: new Date().toISOString(),
          pages_processed: pageNumber ? 1 : 'all'
        }
      };
    } else {
      console.error('API returned non-200 status code:', response.status);
      throw new Error(`API returned status code ${response.status}`);
    }
  } catch (error) {
    console.error('Error converting PDF to text:', error);
    console.error('Error details:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message,
      metadata: {
        extraction_method: 'rapidapi',
        timestamp: new Date().toISOString(),
        error_details: error.response?.data || error.message
      }
    };
  }
}

async function storeTextContent(documentId, text, metadata) {
  console.log('Storing text content for document:', documentId);
  try {
    // First check if the document exists
    const { data: existingDoc, error: checkError } = await supabase
      .from('document_content')
      .select('id')
      .eq('id', documentId)
      .single();
      
    if (checkError) {
      console.error('Error checking document existence:', checkError);
      throw new Error(`Failed to check document existence: ${checkError.message}`);
    }
    
    // Use upsert to handle both update and insert cases
    const { error } = await supabase
      .from('document_content')
      .update({
        content: text,
        metadata: {
          ...metadata,
          processing_status: 'completed',
          storage_time: new Date().toISOString()
        }
      })
      .eq('id', documentId);

    if (error) {
      console.error('Storage error:', error);
      throw new Error(`Failed to store text content: ${error.message}`);
    }

    // Also update assistant_documents status if applicable
    const { error: assistantDocError } = await supabase
      .from('assistant_documents')
      .update({ status: 'ready' })
      .eq('document_id', documentId);
      
    if (assistantDocError) {
      console.warn('Warning: Failed to update assistant document status:', assistantDocError);
    }

    console.log('Text content stored successfully');
    return true;
  } catch (error) {
    console.error('Storage error:', error);
    throw error;
  }
}

app.post('/process', async (req, res) => {
  try {
    const { document_id, storage_path, page_number } = req.body;
    
    if (!document_id || !storage_path) {
      return res.status(400).json({ error: 'Missing required parameters: document_id and storage_path' });
    }

    console.log(`Processing PDF document ${document_id} from path ${storage_path}`);
    
    // Update document status to indicate it's being processed
    await supabase
      .from('document_content')
      .update({
        metadata: {
          processing_status: 'extracting_text',
          extraction_method: 'rapidapi',
          extraction_started: new Date().toISOString()
        }
      })
      .eq('id', document_id);
    
    // Download the PDF file from storage
    const pdfBuffer = await downloadPDFFromStorage(storage_path);
    
    // Convert PDF to text using RapidAPI
    const conversionResult = await convertPDFToText(pdfBuffer, page_number || null);
    
    if (conversionResult.success && conversionResult.text) {
      // Store the extracted text in the database
      await storeTextContent(document_id, conversionResult.text, conversionResult.metadata);
      
      return res.json({
        success: true,
        document_id,
        message: 'PDF processed successfully',
        metadata: conversionResult.metadata
      });
    } else {
      // Update document status to indicate extraction failed
      await supabase
        .from('document_content')
        .update({
          metadata: {
            processing_status: 'extraction_failed',
            extraction_error: conversionResult.error,
            extraction_completed: new Date().toISOString()
          }
        })
        .eq('id', document_id);
        
      return res.status(500).json({
        success: false,
        document_id,
        error: 'PDF text extraction failed',
        details: conversionResult.error
      });
    }
  } catch (error) {
    console.error('Error processing PDF:', error);
    return res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'pdf-processor',
    version: '1.0.0',
    rapidapi: {
      host: RAPIDAPI_HOST,
      key_configured: !!RAPIDAPI_KEY
    }
  });
});

// Start server with port fallback
const startServer = async () => {
  try {
    await new Promise((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`PDF processing service running on port ${port}`);
        resolve();
      });

      server.on('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          console.log(`Port ${port} is in use, trying ${port + 1}...`);
          port++;
          server.close();
          startServer();
        } else {
          console.error('Server error:', error);
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();
