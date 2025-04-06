import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RAPIDAPI_KEY = '109e60ef56msh033c6355bf5052cp149673jsnec27c0641c4d';
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
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: 'large-test.pdf',
      contentType: 'application/pdf'
    });

    console.log('\nSending request to RapidAPI...');
    console.log('This may take a moment for a large document...\n');
    
    // Make the API request
    const response = await axios({
      method: 'post',
      url: RAPIDAPI_URL,
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST,
        'Content-Type': 'application/x-www-form-urlencoded',
        ...formData.getHeaders()
      },
      data: formData,
      timeout: 60000 // 60 second timeout for larger document
    });

    console.log('Response status:', response.status);
    console.log('\nAPI Rate Limits:');
    console.log('- Remaining requests:', response.headers['x-ratelimit-remaining']);
    console.log('- Request limit:', response.headers['x-ratelimit-limit']);
    
    if (response.status === 200) {
      console.log('\n=== Extracted Text ===\n');
      
      const extractedText = response.data.text || response.data;
      
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
      console.error('Error response:', response.data);
    }
  } catch (error) {
    console.error('Error testing PDF conversion:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    } else {
      console.error(error);
    }
  }
}

// Run the test
testPDFConversion().catch(console.error); 