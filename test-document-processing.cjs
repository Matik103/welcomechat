const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

async function testDocumentProcessing() {
  try {
    console.log('Starting document processing test...');

    // Step 1: Verify bucket exists
    console.log('\n1. Verifying bucket exists...');
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('Document_Storage');
    
    if (bucketError) {
      throw new Error(`Bucket verification failed: ${bucketError.message}`);
    }
    console.log('Bucket verification successful:', bucketData);

    // Step 2: Create a test file
    console.log('\n2. Creating test file...');
    const testContent = 'This is a test document for processing.';
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, testContent);

    // Step 3: Upload the test file
    console.log('\n3. Uploading test file...');
    const fileBuffer = fs.readFileSync(testFilePath);
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Document_Storage')
      .upload('test-client/test-document.txt', fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'text/plain'
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }
    console.log('Upload successful:', uploadData);

    // Clean up test file
    fs.unlinkSync(testFilePath);

    // Step 4: Process the document
    console.log('\n4. Processing document...');
    const { data: processData, error: processError } = await supabase.functions.invoke('process-document', {
      method: 'POST',
      body: {
        documentUrl: uploadData.path,
        documentType: 'text/plain',
        clientId: 'test-client',
        agentName: 'test-agent',
        documentId: 'test-' + Date.now()
      }
    });

    if (processError) {
      throw new Error(`Processing failed: ${processError.message}`);
    }
    console.log('Processing successful:', processData);

    // Step 5: Check processing status
    console.log('\n5. Checking processing status...');
    const { data: statusData, error: statusError } = await supabase
      .from('document_processing_status')
      .select('*')
      .eq('client_id', 'test-client')
      .order('created_at', { ascending: false })
      .limit(1);

    if (statusError) {
      throw new Error(`Status check failed: ${statusError.message}`);
    }
    console.log('Status check successful:', statusData);

    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    throw error;
  }
}

// Run the test
testDocumentProcessing()
  .then(() => console.log('All tests completed'))
  .catch((error) => console.error('Test suite failed:', error)); 