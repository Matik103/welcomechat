
import { supabase } from "./src/integrations/supabase/client";
import { supabaseAdmin } from "./src/integrations/supabase/client-admin";
import { updateClient } from "./src/services/clientService";
import fs from 'fs';

async function testClientUpdate() {
  try {
    // Check if supabaseAdmin is configured
    if (!supabaseAdmin) {
      console.error('Supabase admin client is not configured');
      return;
    }

    // Read and execute the SQL script
    const sqlScript = fs.readFileSync('create_test_client.sql', 'utf8');
    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: sqlScript,
      query_params: []
    });

    if (sqlError) {
      console.error('Error creating test client:', sqlError);
      return;
    }

    // Get the test client - get the latest one
    const { data: clientData, error: fetchError } = await supabaseAdmin
      .from('ai_agents')
      .select('*')
      .eq('email', 'test@example.com')
      .eq('interaction_type', 'config')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error fetching test client:', fetchError);
      return;
    }

    if (!clientData) {
      console.error('Test client not found');
      return;
    }

    console.log('Test client found:', clientData);

    // Try to update the client
    const updateData = {
      client_name: 'Updated Test Client',
      email: 'updated@example.com',
      agent_name: 'Updated Test Agent',
      agent_description: 'This is an updated test agent'
    };

    const updatedClient = await updateClient(clientData.id, updateData);
    console.log('Client updated successfully:', updatedClient);

  } catch (error) {
    console.error('Error in test:', error);
  }
}

testClientUpdate(); 
