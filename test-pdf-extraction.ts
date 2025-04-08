import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import FormData from 'form-data';
import fetch from 'node-fetch';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const RAPIDAPI_HOST = 'pdf-to-text-converter.p.rapidapi.com';

async function testPdfExtraction() {
  try {
    console.log('Starting PDF text extraction test...');

    // 1. Get RapidAPI key from Supabase secrets
    console.log('Fetching RapidAPI key from Supabase secrets...');
    const { data: secrets, error: secretsError } = await supabase.functions.invoke('get-secrets', {
      body: { keys: ['VITE_RAPIDAPI_KEY'] }
    });

    if (secretsError) {
      throw new Error(`Failed to get secrets: ${secretsError.message}`);
    }

    if (!secrets?.VITE_RAPIDAPI_KEY) {
      throw new Error('VITE_RAPIDAPI_KEY not found in secrets');
    }

    // 2. Read the test PDF file
    const pdfPath = path.join(process.cwd(), 'test-assets', 'large-test.pdf');
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found at: ${pdfPath}`);
    }

    const fileBuffer = fs.readFileSync(pdfPath);
    console.log('Read PDF file:', pdfPath, 'Size:', fileBuffer.length, 'bytes');

    // 3. Create form data with the PDF
    const formData = new FormData();
    formData.append('file', fileBuffer, { 
      filename: 'test.pdf',
      contentType: 'application/pdf'
    });

    // 4. Call RapidAPI endpoint
    console.log('Calling RapidAPI endpoint...');
    const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
      method: 'POST',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': secrets.VITE_RAPIDAPI_KEY,
        ...formData.getHeaders()
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    // 5. Get extracted text
    const extractedText = await response.text();
    if (!extractedText || extractedText.length === 0) {
      throw new Error('No text extracted from PDF');
    }

    console.log('\nExtracted text:', extractedText.substring(0, 500) + '...');
    console.log('\nTotal extracted text length:', extractedText.length);

    return {
      success: true,
      textLength: extractedText.length,
      sample: extractedText.substring(0, 500)
    };

  } catch (error) {
    console.error('Error during PDF extraction test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test if this file is run directly
if (require.main === module) {
  testPdfExtraction();
}

// Export for use in other files
export { testPdfExtraction }; 
testPdfExtraction(); 