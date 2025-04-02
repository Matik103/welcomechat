import { DocumentProcessingService } from './src/utils/DocumentProcessingService.js';
import fetch from 'node-fetch';
import { randomUUID } from 'crypto';

async function downloadGoogleDoc(docUrl) {
  // Convert view URL to export URL
  const docId = docUrl.split('/d/')[1].split('/')[0];
  const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=pdf`;
  
  console.log('Downloading Google Doc from:', exportUrl);
  const response = await fetch(exportUrl);
  
  if (!response.ok) {
    throw new Error(`Failed to download document: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return new File([arrayBuffer], 'google-doc.pdf', { type: 'application/pdf' });
}

async function downloadPDF(url) {
  console.log('Downloading PDF from:', url);
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download document: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return new File([arrayBuffer], 'test-doc.pdf', { type: 'application/pdf' });
}

async function testDocProcessing(url, isGoogleDoc = false) {
  try {
    // Download the document
    const file = isGoogleDoc 
      ? await downloadGoogleDoc(url)
      : await downloadPDF(url);
    
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size + ' bytes'
    });

    const clientId = randomUUID();
    console.log('Using client ID:', clientId);

    const result = await DocumentProcessingService.processDocument(
      file,
      'pdf',
      clientId,
      'test-agent'
    );

    console.log('Processing completed!');
    console.log('Success:', result.success);
    if (result.jobId) console.log('Job ID:', result.jobId);
    if (result.error) console.log('Error:', result.error);
    if (result.content) console.log('Content:', JSON.stringify(result.content, null, 2));
  } catch (error) {
    console.error('Document processing error:', error);
  }
}

// Test with Google Doc
console.log('\n=== Testing with Google Doc ===\n');
await testDocProcessing(
  'https://docs.google.com/document/d/1DnBmbdC57DkrwzbOKd0PCM2eXgHccciHIJ95PYM08tw/edit?usp=sharing',
  true
);

// Test with sample PDF
console.log('\n=== Testing with sample PDF ===\n');
await testDocProcessing(
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  false
); 