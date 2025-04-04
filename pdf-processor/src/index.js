import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import { promisify } from 'util';
import extract from 'pdf-extract';

dotenv.config();

const app = express();
let port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

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

  return Buffer.from(await data.arrayBuffer());
}

const convertPDFToText = async (pdfPath) => {
  return new Promise((resolve, reject) => {
    const options = {
      type: 'text',  // extract the actual text content, not the raw text-content
      clean: true,   // clean the extracted text content
    };

    const processor = extract(pdfPath, options, (err) => {
      if (err) {
        reject(err);
      }
    });

    let text = '';
    let pageCount = 0;

    processor.on('page', (data) => {
      text += data.text + '\n';
      pageCount++;
    });

    processor.on('complete', () => {
      resolve({ text, pageCount });
    });

    processor.on('error', (err) => {
      reject(err);
    });
  });
};

async function storeTextContent(documentId, text, metadata) {
  console.log('Storing text content for document:', documentId);
  try {
    const { error } = await supabase
      .from('document_content')
      .upsert({
        id: documentId,
        content: text,
        metadata: {
          ...metadata,
          storage_time: new Date().toISOString()
        }
      });

    if (error) {
      console.error('Storage error:', error);
      throw new Error(`Failed to store text content: ${error.message}`);
    }

    console.log('Text content stored successfully');
  } catch (error) {
    console.error('Storage error:', error);
    throw error;
  }
}

app.post('/process', async (req, res) => {
  try {
    const { filePath } = req.body;
    
    if (!filePath) {
      return res.status(400).json({ error: 'No file path provided' });
    }

    const result = await convertPDFToText(filePath);

    return res.json({
      text: result.text,
      metadata: {
        extraction_method: 'pdf-extract',
        pages_processed: result.pageCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return res.status(500).json({ error: error.message });
  }
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