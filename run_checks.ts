
import { supabaseAdmin } from "./src/integrations/supabase/client-admin";
import fs from 'fs';

async function runDatabaseChecks() {
  try {
    // Check RLS policies on activities table
    const policyCheckSql = fs.readFileSync('check_applied_policy.sql', 'utf8');
    const { data: policyData, error: policyError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: policyCheckSql,
      query_params: []
    });
    
    if (policyError) {
      console.error('Error checking policies:', policyError);
    } else {
      console.log('RLS Policy Check:', JSON.stringify(policyData, null, 2));
    }
    
    // Check activities function definition
    const funcCheckSql = fs.readFileSync('verify_activities_function.sql', 'utf8');
    const { data: funcData, error: funcError } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: funcCheckSql,
      query_params: []
    });
    
    if (funcError) {
      console.error('Error checking function:', funcError);
    } else {
      console.log('Function Check:', JSON.stringify(funcData, null, 2));
    }
    
    // Optionally: Apply the changes if not applied yet
    if (!policyData || policyData.length === 0 || !policyData[0].policies || policyData[0].policies.length === 0) {
      console.log('RLS policy not found. Consider applying update_activities_rls.sql');
    } else {
      console.log('RLS policy found and configured correctly.');
    }
  } catch (error) {
    console.error('Error executing database checks:', error);
  }
}

runDatabaseChecks();
