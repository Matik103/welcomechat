
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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
    const { document_id, storage_path } = req.body;
    
    if (!document_id || !storage_path) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Instead of extracting the text, return a placeholder response
    return res.json({
      message: "PDF processing service ready. Text extraction functionality will be implemented with a different approach.",
      document_id,
      metadata: {
        extraction_method: 'pending-implementation',
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
