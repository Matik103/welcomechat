
import { supabase } from '@/integrations/supabase/client';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/client-form';

// Sync AI agent table with OpenAI
export const syncAiAgentTable = async (clientId: string) => {
  try {
    // Check if table exists
    const { data: tablesData, error: tablesError } = await supabase
      .rpc('check_table_exists' as any, { table_name: `agent_${clientId}` });
    
    if (tablesError) {
      console.error('Error checking table existence:', tablesError);
      return false;
    }
    
    const tableExists = tablesData && (tablesData as any).exists || false;
    
    // If table doesn't exist, create it
    if (!tableExists) {
      // Create vector extension if not exists
      await supabase.rpc('create_vector_extension' as any);
      
      // Create the agent table
      const { error: createError } = await supabase
        .rpc('create_ai_agent_table' as any, { client_id: clientId });
      
      if (createError) {
        console.error('Error creating AI agent table:', createError);
        return false;
      }
      
      // Log activity
      await createClientActivity(
        clientId,
        'ai_agent_table_created' as ActivityType,
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
