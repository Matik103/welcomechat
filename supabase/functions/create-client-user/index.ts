
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

console.log("create-client-user function loading...");

// Create a Supabase client with the service role key
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Helper function to sanitize string input
function sanitizeString(input: string): string {
  if (!input) return "";
  let sanitized = input.trim();
  // Remove quotes and special characters that might cause SQL injection or security issues
  sanitized = sanitized.replace(/['"`\\]/g, '');
  return sanitized;
}

serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*' } });
  }

  try {
    console.log("Request received to create client user");
    
    // Check authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Extract and validate the JWT
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parse request body
    const requestData = await req.json();
    
    // Sanitize input data to prevent injection attacks
    const email = sanitizeString(requestData.email);
    const clientId = requestData.client_id; // UUIDs don't need sanitization
    const clientName = sanitizeString(requestData.client_name);
    const agentName = sanitizeString(requestData.agent_name || '');
    const agentDescription = sanitizeString(requestData.agent_description || '');
    
    console.log("Creating user for:", { email, clientId, clientName });

    if (!email || !clientId) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email and client_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Generate a standardized temporary password
    const tempPassword = `Welcome${new Date().getFullYear()}!`;
    console.log("Generated temporary password");

    // Create a new user with the client role
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm the email
      user_metadata: {
        client_id: clientId,
        client_name: clientName,
        agent_name: agentName,
        agent_description: agentDescription
      }
    });

    if (createError) {
      console.error("Error creating user:", createError);
      return new Response(JSON.stringify({ 
        error: 'Failed to create user', 
        details: createError.message 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Set the user role to 'client'
    try {
      console.log("Setting role for user:", newUser.user.id);
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: newUser.user.id,
          role: 'client'
        });

      if (roleError) {
        console.error("Error setting user role:", roleError);
        // Continue even with role error, we'll handle it on the client side
      }
    } catch (roleError) {
      console.error("Exception setting user role:", roleError);
      // Continue even with role error, we'll handle it on the client side
    }
    
    // Check if agent creation is needed
    console.log("Creating AI agent for client:", clientId);
    try {
      // Generate AI prompt based on agent name and description
      let promptBase = `You are ${agentName}, an AI assistant`;
      if (agentDescription) {
        promptBase += ` that ${agentDescription}`;
      }
      
      // Create the AI agent record
      const { error: agentError } = await supabase
        .from('ai_agents')
        .insert({
          client_id: clientId,
          name: agentName || 'Assistant',
          agent_description: agentDescription || '',
          content: '',
          ai_prompt: promptBase,
          settings: {
            agent_description: agentDescription,
            client_name: clientName
          }
        });
        
      if (agentError) {
        console.error("Error creating AI agent:", agentError);
      }
    } catch (agentError) {
      console.error("Exception creating AI agent:", agentError);
      // Continue even with agent error
    }

    // Send back success response with temp password
    return new Response(
      JSON.stringify({
        success: true,
        user_id: newUser.user.id,
        temp_password: tempPassword
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    console.error("Exception in create-client-user:", error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});
