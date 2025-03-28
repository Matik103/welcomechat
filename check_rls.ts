import { supabase } from './src/integrations/supabase/client';
import fs from 'fs';

async function checkRLSPolicies() {
  try {
    const sql = fs.readFileSync('check_rls_policies.sql', 'utf8');
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: sql,
      query_params: []
    });

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log('RLS Policies:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRLSPolicies(); 