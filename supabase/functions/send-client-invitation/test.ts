import { createClient } from '@supabase/supabase-js';

// Test data
const testData = {
  clientId: crypto.randomUUID(), // Generate a random UUID for testing
  email: "hookarte@gmail.com",
  clientName: "Test Client",
  agentName: "TestBot Assistant"
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing send-client-invitation function...');
console.log('Test data:', testData);

try {
  const { data, error } = await supabase.functions.invoke('send-client-invitation', {
    body: testData
  });

  if (error) {
    console.error('Error invoking function:', error);
    Deno.exit(1);
  }

  console.log('Function response:', data);
  console.log('Test completed successfully!');
} catch (err) {
  console.error('Test failed:', err);
  Deno.exit(1);
} 