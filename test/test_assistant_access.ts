import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: '../.env' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function testAssistantAccess() {
  console.log('Starting assistant access test...');
  
  // Initialize the Supabase client with type assertion
  const supabase = createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string);

  try {
    console.log('Creating test user...');
    // 1. Create a test user
    const { data: userData, error: signUpError } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    if (signUpError) throw signUpError;
    console.log('Test user created:', userData.user?.id);

    // 2. Create a test document
    console.log('Creating test document...');
    const { data: docData, error: docError } = await supabase
      .from('document_content')
      .insert({
        client_id: userData.user?.id,
        document_id: 'test-doc-1',
        content: 'This is a test document content',
        filename: 'test.txt',
        file_type: 'text/plain'
      })
      .select()
      .single();

    if (docError) throw docError;
    console.log('Test document created:', docData.id);

    // 3. Create assistant document link
    console.log('Creating assistant document link...');
    const { error: assistantDocError } = await supabase
      .from('assistant_documents')
      .insert({
        document_id: docData.id,
        assistant_id: userData.user?.id,
        client_id: userData.user?.id,
        status: 'ready'
      });

    if (assistantDocError) throw assistantDocError;
    console.log('Assistant document link created');

    // 4. Try to access the document as the assistant
    console.log('Testing document access...');
    const { data: testData, error: testError } = await supabase
      .from('document_content')
      .select('id, content, filename')
      .eq('id', docData.id)
      .single();

    if (testError) {
      console.error('Access test failed:', testError);
      return false;
    }

    console.log('Successfully accessed document:', testData);
    return true;

  } catch (error) {
    console.error('Test failed:', error);
    return false;
  }
}

// Run the test
testAssistantAccess().then((success) => {
  console.log('Test completed:', success ? 'PASSED' : 'FAILED');
  process.exit(success ? 0 : 1);
}); 