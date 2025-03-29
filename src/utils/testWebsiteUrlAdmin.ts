
import { supabaseAdmin } from "@/integrations/supabase/admin";

async function testWebsiteUrlOperations() {
  console.log('Starting website URL operations test...');
  
  try {
    // Test adding a website URL
    const testUrl = {
      client_id: 'test-client-id',
      url: 'https://example.com',
      refresh_rate: 60,
      status: 'pending'
    };
    
    console.log('Attempting to add website URL:', testUrl);
    
    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('website_urls')
      .insert(testUrl)
      .select()
      .single();
      
    if (insertError) {
      console.error('Error adding website URL:', insertError);
      return;
    }
    
    console.log('Successfully added website URL:', insertData);
    
    // Test deleting the website URL
    const { error: deleteError } = await supabaseAdmin
      .from('website_urls')
      .delete()
      .eq('id', insertData.id);
      
    if (deleteError) {
      console.error('Error deleting website URL:', deleteError);
      return;
    }
    
    console.log('Successfully deleted website URL');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testWebsiteUrlOperations();
