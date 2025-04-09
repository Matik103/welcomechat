import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mgjodiqecnnltsgorife.supabase.co";
const SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1nam9kaXFlY25ubHRzZ29yaWZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczODY4ODA3MCwiZXhwIjoyMDU0MjY0MDcwfQ.qB6EALQwgkR9BQ2_QR_4MmXFQgFrm17D_yODKmnFE7M";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTestClient() {
  try {
    // Create client
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert([
        {
          client_name: 'Test Client',
          email: 'test@example.com',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (clientError) {
      console.error('Error creating client:', clientError);
      return null;
    }

    console.log('Test client created:', client);
    return client;
  } catch (error) {
    console.error('Error in createTestClient:', error);
    return null;
  }
}

// Run the function
createTestClient(); 