
import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';

// Sync AI agent table with OpenAI
export const syncAiAgentTable = async (clientId: string) => {
  try {
    // Check if table exists
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('check_table_exists', { table_name: `agent_${clientId}` });
    
    if (tablesError) {
      console.error('Error checking table existence:', tablesError);
      return false;
    }
    
    const tableExists = tablesData?.exists || false;
    
    // If table doesn't exist, create it
    if (!tableExists) {
      // Create vector extension if not exists
      await supabase.rpc('create_vector_extension');
      
      // Create the agent table
      const { error: createError } = await supabase
        .rpc('create_ai_agent_table', { client_id: clientId });
      
      if (createError) {
        console.error('Error creating AI agent table:', createError);
        return false;
      }
      
      // Log activity
      await createClientActivity(
        clientId,
        'ai_agent_table_created',
        `AI agent table created for client: ${clientId}`
      );
      
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Error syncing AI agent table:', error);
    return false;
  }
};

export default syncAiAgentTable;
