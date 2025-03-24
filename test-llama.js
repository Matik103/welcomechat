import { LlamaCloudService } from './src/utils/LlamaCloudService';
import { supabase } from './src/integrations/supabase/client';

async function testLlamaIntegration() {
  try {
    console.log('1. Testing API Key Configuration...');
    const apiKey = process.env.VITE_LLAMA_CLOUD_API_KEY;
    if (!apiKey || !apiKey.startsWith('llx-')) {
      throw new Error('Invalid or missing LLAMA_CLOUD_API_KEY');
    }
    console.log('✅ API Key format verified');

    console.log('\n2. Testing document parsing...');
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
    console.log('✅ Document parsing successful');

    console.log('\n3. Testing AI agent storage...');
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

    console.log('\n4. Testing OpenAI Assistant integration...');
    const assistantResult = await LlamaCloudService.verifyAssistantIntegration();
    console.log('Assistant integration result:', JSON.stringify(assistantResult, null, 2));

    if (!assistantResult.success) {
      throw new Error(`Assistant integration failed: ${assistantResult.error}`);
    }
    console.log('✅ Assistant integration verified');

    console.log('\nAll tests completed successfully! 🎉');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testLlamaIntegration(); 