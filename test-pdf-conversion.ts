import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get API key from environment variable
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
if (!RAPIDAPI_KEY) {
  console.error('Error: RAPIDAPI_KEY environment variable is not set');
  process.exit(1);
}

const RAPIDAPI_HOST = 'pdf-to-text-converter.p.rapidapi.com';
const RAPIDAPI_URL = 'https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert';

async function testPDFConversion() {
  try {
    // Use the large test PDF file
    const testPdfPath = path.join(__dirname, 'test-assets', 'large-test.pdf');
    
    if (!fs.existsSync(testPdfPath)) {
      console.error('Large test PDF file not found:', testPdfPath);
      console.log('Please ensure you have created the large-test.pdf file first');
      return;
    }

    // Read the PDF file
    const pdfBuffer = fs.readFileSync(testPdfPath);
    console.log(`PDF file size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`);

    // Create form data
    const form = new FormData();
    form.append('file', pdfBuffer, {
      filename: 'large-test.pdf',
      contentType: 'application/pdf'
    });
    
    // Optional: Add page parameter
    // form.append('page', '1');

    console.log('\nSending request to RapidAPI:', {
      url: RAPIDAPI_URL,
      fileSize: pdfBuffer.length
    });
    
    // Make the API request
    const response = await axios({
      method: 'post',
      url: RAPIDAPI_URL,
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY,
        ...form.getHeaders()
      },
      data: form,
      maxBodyLength: Infinity,
      timeout: 60000 // 60 second timeout for larger document
    });

    console.log('\nResponse Status:', response.status);

    let extractedText = '';
    if (response.data) {
      if (typeof response.data === 'string') {
        extractedText = response.data;
      } else {
        try {
          extractedText = response.data.text || response.data.content || JSON.stringify(response.data);
        } catch (err) {
          console.warn('Failed to process response data:', err);
          extractedText = String(response.data);
        }
      }
    }

    if (extractedText) {
      console.log('\n=== Extracted Text ===\n');
      
      // Split the text into pages (assuming pages are separated by multiple newlines)
      const pages = extractedText.split(/\n{3,}/);
      
      pages.forEach((page, index) => {
        console.log(`\n--- Page ${index + 1} ---\n`);
        console.log(page.trim());
        console.log('\n' + '-'.repeat(80));
      });
      
      // Save the extracted text to a file
      const outputPath = path.join(__dirname, 'test-assets', 'extracted-text.txt');
      fs.writeFileSync(outputPath, extractedText);
      console.log(`\nExtracted text has been saved to: ${outputPath}`);
      
      // Print some statistics
      console.log('\nDocument Statistics:');
      console.log(`- Total pages: ${pages.length}`);
      console.log(`- Total characters: ${extractedText.length}`);
      console.log(`- Total words: ${extractedText.split(/\s+/).length}`);
      console.log(`- Total lines: ${extractedText.split('\n').length}`);
    } else {
      console.log('\nNo text content in response:', response.data);
    }

    // Check rate limits
    console.log('\nAPI Rate Limits:');
    console.log('- Remaining:', response.headers['x-ratelimit-remaining']);
    console.log('- Limit:', response.headers['x-ratelimit-limit']);
    console.log('- Reset:', new Date(parseInt(response.headers['x-ratelimit-reset']) * 1000).toLocaleString());

  } catch (error) {
    console.error('\nError during PDF conversion:');
    if (axios.isAxiosError(error)) {
      console.error('Status:', error.response?.status);
      console.error('Headers:', error.response?.headers);
      console.error('Response:', error.response?.data);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

testPDFConversion(); 