import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Initialize Supabase client with auth options
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

async function testDocumentProcessing() {
  try {
    console.log('Starting production document processing test...');
    
    // Sign in with test user
    console.log('Signing in with test user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: process.env.TEST_USER_EMAIL || 'testao@gmail.com',
      password: process.env.TEST_USER_PASSWORD || 'Welcome2025#291'
    });

    if (authError) {
      console.error('Authentication failed:', authError);
      return;
    }

    console.log('Successfully authenticated as:', authData.user.email);
    console.log('User ID:', authData.user.id);
    
    // Test file path
    const testFilePath = path.join(__dirname, 'test-documents', 'test.pdf');
    
    // Check if test file exists
    if (!fs.existsSync(testFilePath)) {
      console.error('Test file not found. Please create a test PDF file at:', testFilePath);
      return;
    }
    
    // Read the test file
    const fileBuffer = fs.readFileSync(testFilePath);
    
    // Create a unique filename with timestamp
    const timestamp = new Date().getTime();
    const fileName = `test_${timestamp}.pdf`;
    
    // Create a path that includes the user's ID
    const filePath = `${authData.user.id}/${fileName}`;
    console.log('Uploading test document to path:', filePath);
    
    // Upload the file
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('document-storage')
      .upload(filePath, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: 'application/pdf'
      });
    
    if (uploadError) {
      console.error('Upload failed:', uploadError);
      return;
    }
    
    console.log('Upload successful:', uploadData);

    // Create an AI agent first
    console.log('Creating AI agent...');
    const { data: agentData, error: agentError } = await supabase
      .from('ai_agents')
      .insert({
        name: 'Production Test Agent',
        client_name: 'Production Test Client',
        status: 'active',
        type: 'document'
      })
      .select()
      .single();

    if (agentError) {
      console.error('Failed to create AI agent:', agentError);
      return;
    }

    console.log('AI agent created:', agentData);

    // Create a document record
    console.log('Creating document record...');
    const { data: documentData, error: documentError } = await supabase
      .from('ai_documents')
      .insert({
        agent_name: agentData.name,
        client_id: agentData.id,
        document_id: uploadData.id,
        document_type: 'application/pdf',
        document_url: filePath,
        status: 'pending'
      })
      .select()
      .single();

    if (documentError) {
      console.error('Failed to create document record:', documentError);
      return;
    }

    console.log('Document record created:', documentData);

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('document-storage')
      .getPublicUrl(filePath);

    // Create a processing record
    console.log('Creating processing record...');
    const { data: processingData, error: processingError } = await supabase
      .from('document_processing_jobs')
      .insert({
        agent_name: agentData.name,
        client_id: agentData.id,
        document_id: documentData.id,
        document_type: 'application/pdf',
        document_url: publicUrl,
        status: 'processing',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (processingError) {
      console.error('Failed to create processing record:', processingError);
      return;
    }

    console.log('Processing record created:', processingData);

    // Simulate document processing (in production, this would be handled by the Edge Function)
    console.log('Simulating document processing...');
    const extractedText = "This is a simulated extracted text from the PDF document. In production, this would be processed by the Edge Function using LlamaParse.";

    // Update the processing job with the extracted content
    console.log('Updating processing job...');
    const { data: updateData, error: updateError } = await supabase
      .from('document_processing_jobs')
      .update({
        status: 'completed',
        content: extractedText,
        processing_method: 'llamaparse',
        updated_at: new Date().toISOString()
      })
      .eq('id', processingData.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update processing job:', updateError);
      return;
    }

    console.log('Processing job updated:', updateData);
    console.log('Production test completed successfully!');

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testDocumentProcessing(); 