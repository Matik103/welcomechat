
/// <reference types="vite/client" />

import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(process.cwd(), '.env.test') });

import { LlamaCloudService } from './src/utils/LlamaCloudService';
import { LlamaExtractionService } from './src/utils/LlamaExtractionService'; 
import { supabase } from './src/integrations/supabase/client';

async function testLlamaIntegration(): Promise<void> {
  try {
    console.log('1. Testing API Key Configuration...');
    const apiKey = process.env.VITE_LLAMA_CLOUD_API_KEY;
    if (!apiKey || !apiKey.startsWith('llx-')) {
      throw new Error('Invalid or missing LLAMA_CLOUD_API_KEY');
    }
    console.log('✅ API Key format verified');

    console.log('\n2. Testing LlamaParse API connectivity...');
    const integrationTest = await LlamaCloudService.verifyAssistantIntegration();
    
    if (!integrationTest.success) {
      throw new Error(`API connection test failed: ${integrationTest.error}`);
    }
    console.log('✅ API connection test successful');
    console.log(`   Files in account: ${integrationTest.filesCount}`);

    console.log('\n3. Testing document parsing...');
    // Test with a sample PDF URL
    const testUrl = 'https://arxiv.org/pdf/2302.13971.pdf';
    const result = await LlamaCloudService.parseDocument(
      testUrl,
      'pdf',
      'test-client-id',
      'test-agent'
    );
    console.log('Parse result:', JSON.stringify(result, null, 2));

    if (!result.success) {
      throw new Error(`Document parsing failed: ${result.error}`);
    }
    console.log('✅ Document parsing initiated successfully');
    console.log(`   File ID: ${result.file_id}`);
    console.log(`   Job ID: ${result.job_id}`);

    console.log('\n4. Testing AI agent storage...');
    // Test storing in ai_agents table
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({
        client_id: 'test-client-id',
        name: 'test-agent',
        content: 'Test content',
        url: testUrl,
        interaction_type: "document",
        settings: {
          title: "Test Document",
          document_type: 'pdf',
          source_url: testUrl,
          processing_method: 'llamaparse',
          processed_at: new Date().toISOString()
        },
        status: "active",
        type: 'pdf',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Storage test failed: ${error.message}`);
    }
    console.log('✅ Storage test successful');

    // Check job status if a job was created
    if (result.job_id) {
      console.log('\n5. Testing job status check...');
      const jobStatus = await LlamaExtractionService.checkJobStatus(result.job_id);
      console.log('Job status:', JSON.stringify(jobStatus, null, 2));
      console.log('✅ Job status check successful');
    }

    console.log('\nAll tests completed successfully! 🎉');
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : String(error));
    console.error('Error details:', error);
    process.exit(1);
  }
}

testLlamaIntegration();
