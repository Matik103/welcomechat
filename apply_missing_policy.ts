
import { supabaseAdmin } from "./src/integrations/supabase/client-admin";
import fs from 'fs';

async function applyMissingPolicy() {
  try {
    // Check if policy exists first
    const checkSql = fs.readFileSync('check_rls_policies.sql', 'utf8');
    const { data: checkData, error: checkError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: checkSql,
      query_params: []
    });
    
    if (checkError) {
      console.error('Error checking policies:', checkError);
      return;
    }
    
    const policies = checkData[0]?.policies || [];
    const policyExists = policies.some(p => 
      p.table_name === 'activities' && 
      p.policy_name === 'Enable insert access for authenticated users'
    );
    
    if (!policyExists) {
      console.log('Policy does not exist. Applying RLS policy for activities table...');
      const applySql = fs.readFileSync('update_activities_rls.sql', 'utf8');
      const { data: applyData, error: applyError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: applySql,
        query_params: []
      });
      
      if (applyError) {
        console.error('Error applying policy:', applyError);
      } else {
        console.log('RLS policy applied successfully:', applyData);
      }
    } else {
      console.log('RLS policy already exists. No changes needed.');
    }
  } catch (error) {
    console.error('Error in applyMissingPolicy:', error);
  }
}

applyMissingPolicy();
