
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface DynamicQueryRequest {
  tableName: string;
  query: string;
}

serve(async (req) => {
  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get the request body
    const { tableName, query } = await req.json() as DynamicQueryRequest

    if (!tableName || !query) {
      return new Response(
        JSON.stringify({ error: 'Table name and query are required' }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }
    
    // Sanitize the table name to prevent SQL injection
    const sanitizedTableName = tableName.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    
    // Replace the placeholder in the query
    const finalQuery = query.replace(/\$\{tableName\}/g, sanitizedTableName)
    
    // Execute the query using PostgreSQL
    const { data, error } = await supabaseClient.rpc('exec_sql', {
      sql_query: finalQuery
    })
    
    if (error) {
      console.error('Error executing query:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }
    
    return new Response(
      JSON.stringify(data),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
