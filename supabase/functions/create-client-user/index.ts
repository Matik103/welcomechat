
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Function to sanitize string values to prevent SQL syntax errors
const sanitizeString = (value: string): string => {
  if (!value) return "";
  
  // Trim and then completely remove any quotes or backslashes
  const sanitized = value.trim().replace(/['"`\\]/g, '');
  
  console.log(`Sanitized value from "${value}" to "${sanitized}"`);
  
  return sanitized;
};

// Function to generate an AI prompt based on the agent name and description
const generateAiPrompt = (agentName: string, agentDescription: string): string => {
  // Sanitize inputs first to prevent SQL injection
  const safeName = sanitizeString(agentName);
  const safeDescription = sanitizeString(agentDescription);
  
  // Create a default prompt if no description is provided
  if (!safeDescription || safeDescription.trim() === '') {
    return `You are ${safeName}, a helpful AI assistant. Your goal is to provide clear, concise, and accurate information to users.`;
  }
  
  // Generate a prompt with the agent's name and description
  return `You are ${safeName}. ${safeDescription}

As an AI assistant, your goal is to embody this description in all your interactions while providing helpful, accurate information to users. Maintain a conversational tone that aligns with the description above.

You have access to a knowledge base of documents and websites that have been processed and stored for your reference. When answering questions, prioritize information from this knowledge base when available.`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables for Supabase client");
      throw new Error("Missing environment variables for Supabase client");
    }
    
    console.log("Creating Supabase client with URL:", supabaseUrl);
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey
    );
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
      console.log("Request body parsed:", {
        email: body.email,
        client_id: body.client_id,
        client_name: body.client_name,
        agent_name: body.agent_name,
        agent_description: body.agent_description
      });
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    const { email, client_id, client_name, agent_name, agent_description } = body;
    
    if (!email || !client_id) {
      console.error("Missing required fields:", { 
        hasEmail: !!email, 
        hasClientId: !!client_id 
      });
      return new Response(
        JSON.stringify({ error: "Email and client_id are required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Strongly sanitize all input values
    const sanitizedEmail = sanitizeString(email);
    const sanitizedClientName = sanitizeString(client_name);
    const sanitizedAgentName = agent_name ? sanitizeString(agent_name) : '';
    const sanitizedAgentDescription = agent_description ? sanitizeString(agent_description) : '';
    
    console.log("Sanitized values:", {
      email: sanitizedEmail,
      client_name: sanitizedClientName,
      agent_name: sanitizedAgentName,
      agent_description: sanitizedAgentDescription
    });
    
    // Check if user already exists
    console.log("Checking if user exists:", sanitizedEmail);
    const { data: { users: existingUsers }, error: userCheckError } = await supabase.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error("Error checking existing user:", userCheckError);
      throw new Error(`Failed to check existing user: ${userCheckError.message}`);
    }

    const existingUser = existingUsers?.find(u => u.email === sanitizedEmail);
    console.log("Existing user check result:", existingUser ? "Found" : "Not found");
    
    // Generate a secure temporary password that meets Supabase requirements
    const generateSecurePassword = () => {
      const year = new Date().getFullYear();
      const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `Welcome${year}#${randomDigits}`;
    };

    let userId: string;
    let userPassword: string;
    const tempPassword = generateSecurePassword();
    console.log("Generated temporary password");
    
    // If user exists, update their metadata and password
    if (existingUser) {
      console.log("User already exists, updating metadata and password:", sanitizedEmail);
      userId = existingUser.id;
      
      // Update user metadata and password
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: tempPassword,
          user_metadata: { 
            client_id,
            client_name: sanitizedClientName,
            agent_name: sanitizedAgentName,
            user_type: "client"
          }
        }
      );
      
      if (updateError) {
        console.error("Failed to update user:", updateError);
        throw new Error(`Failed to update user: ${updateError.message}`);
      }

      userPassword = tempPassword;
      console.log("User updated successfully with new password");
    } else {
      // Create a new user with Supabase's built-in user management
      console.log("Creating new user:", sanitizedEmail);
      
      // Create user with admin API to ensure proper auth setup
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: sanitizedEmail,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { 
          client_id,
          client_name: sanitizedClientName,
          agent_name: sanitizedAgentName,
          user_type: "client"
        },
        email_confirm_sent: false // Disable automatic confirmation email
      });
      
      if (createError) {
        console.error("Failed to create user:", createError);
        throw new Error(`Failed to create user: ${createError.message}`);
      }
      
      if (!newUser || !newUser.user) {
        console.error("User creation failed with no error but no user returned");
        throw new Error("User creation failed with unknown error");
      }
      
      userId = newUser.user.id;
      userPassword = tempPassword;
      console.log("User created successfully with ID:", userId);
    }
    
    // Create client role for this user
    try {
      console.log("Creating user role for user:", userId);
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: userId,
          role: "client",
          client_id: client_id
        }, {
          onConflict: 'user_id,role',
          ignoreDuplicates: false
        });
      
      if (roleError) {
        console.warn("Could not create user role:", roleError.message);
      }
    } catch (roleError) {
      console.warn("Error creating user role:", roleError);
    }
    
    // Generate AI prompt
    const aiPrompt = generateAiPrompt(sanitizedAgentName, sanitizedAgentDescription);
    console.log("Generated AI prompt:", aiPrompt);
    
    // Create AI agent entry for this client - using sanitized agent name
    try {
      console.log("Creating AI agent for client:", client_id);
      const { error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: client_id,
          name: sanitizedAgentName,
          agent_description: sanitizedAgentDescription,
          ai_prompt: aiPrompt,
          settings: {
            agent_description: sanitizedAgentDescription,
            client_name: sanitizedClientName,
            created_at: new Date().toISOString()
          }
        });
      
      if (agentError) {
        console.warn("Could not create AI agent entry:", agentError.message);
      }
    } catch (agentError) {
      console.warn("Error creating AI agent:", agentError);
    }
    
    // Log the agent creation in client_activities
    try {
      await supabase.from("client_activities").insert({
        client_id: client_id,
        activity_type: "ai_agent_created",
        description: "AI agent was created during client signup",
        metadata: {
          agent_name: sanitizedAgentName,
          agent_description: sanitizedAgentDescription
        }
      });
    } catch (activityError) {
      console.warn("Error logging agent creation activity:", activityError);
    }
    
    // Return success response with user info and password if it was just created
    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Client user account created/updated successfully",
        user_id: userId,
        temp_password: userPassword
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (err) {
    console.error("Error in create-client-user function:", err);
    
    return new Response(
      JSON.stringify({ 
        error: err.message || "Failed to create client user" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
