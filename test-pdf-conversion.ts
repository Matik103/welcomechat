import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';

// Function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Function to test PDF extraction
async function testPDFExtraction(filePath: string) {
  try {
    console.log(`\nTesting PDF extraction for: ${path.basename(filePath)}`);
    const fileStats = fs.statSync(filePath);
    console.log(`File size: ${formatFileSize(fileStats.size)}\n`);

    // Create form data with Buffer
    const formData = new FormData();
    const buffer = fs.readFileSync(filePath);
    formData.append('file', buffer, {
      filename: path.basename(filePath),
      contentType: 'application/pdf'
    });

    console.log('Sending request to RapidAPI...');

    const response = await fetch('https://pdf-to-text-converter.p.rapidapi.com/api/pdf-to-text/convert', {
      method: 'POST',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'pdf-to-text-converter.p.rapidapi.com',
        ...formData.getHeaders()
      },
      // @ts-ignore - FormData is compatible with fetch body
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response headers:', response.headers);
      console.error('Response status:', response.status);
      console.error('Error details:', errorText);
      throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const text = await response.text();
    console.log('\nExtraction successful!');
    console.log('Text preview:', text.substring(0, 200) + '...');
    console.log(`Total text length: ${text.length} characters`);

    // Save extracted text to file
    const outputPath = path.join('test-assets', `extracted-${path.basename(filePath, '.pdf')}.txt`);
    fs.writeFileSync(outputPath, text);
    console.log(`Full text saved to: ${outputPath}`);

    return text;
  } catch (error) {
    console.error('Error during extraction:', error);
    return null;
  }
}

// Function to run tests
async function runTests() {
  const testFiles = [
    'test-assets/small-test.pdf',
    'test-assets/medium-test.pdf',
    'test-assets/large-test.pdf',
    'test-assets/xlarge-test.pdf'
  ];

  console.log('Starting PDF extraction tests...\n');

  for (const file of testFiles) {
    await testPDFExtraction(file);
    // Add a delay between requests to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\nAll tests completed!');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 