
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// Function to generate an AI prompt based on the agent name and description
const generateAiPrompt = (agentName: string, agentDescription: string, clientName: string): string => {
  // System prompt template to ensure assistants only respond to client-specific questions
  const SYSTEM_PROMPT_TEMPLATE = `You are an AI assistant created within the ByClicks AI system, designed to serve individual clients with their own unique knowledge bases. Each assistant is assigned to a specific client, and must only respond based on the information available for that specific client.

Rules & Limitations:
✅ Client-Specific Knowledge Only:
- You must only provide answers based on the knowledge base assigned to your specific client.
- If a question is outside your assigned knowledge, politely decline to answer.

✅ Professional, Friendly, and Helpful:
- Maintain a conversational and approachable tone.
- Always prioritize clear, concise, and accurate responses.

🚫 Do NOT Answer These Types of Questions:
- Personal or existential questions (e.g., "What's your age?" or "Do you have feelings?").
- Philosophical or abstract discussions (e.g., "What is the meaning of life?").
- Technical questions about your own system or how you are built.
- Anything unrelated to the client you are assigned to serve.`;
  
  // Create a client-specific prompt
  let prompt = `${SYSTEM_PROMPT_TEMPLATE}\n\nYou are ${agentName}, an AI assistant for ${clientName}.`;
  
  // Add agent description if provided
  if (agentDescription && agentDescription.trim() !== '') {
    prompt += ` ${agentDescription}`;
  } else {
    prompt += ` Your goal is to provide clear, concise, and accurate information to users based on the knowledge provided to you.`;
  }
  
  // Add instructions for responding to off-limit questions
  prompt += `\n\nAs an AI assistant, your goal is to embody this description in all your interactions while providing helpful, accurate information to users. Maintain a conversational tone that aligns with the description above.

When asked questions outside your knowledge base or off-limit topics, respond with something like:
- "I'm here to assist with questions related to ${clientName}'s business. How can I help you with that?"
- "I focus on providing support for ${clientName}. If you need assistance with something else, I recommend checking an appropriate resource."
- "I'm designed to assist with ${clientName}'s needs. Let me know how I can help with that!"

You have access to a knowledge base of documents and websites that have been processed and stored for your reference. When answering questions, prioritize information from this knowledge base when available.`;

  return prompt;
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
        agent_description: body.agent_description,
        logo_url: body.logo_url,
        logo_storage_path: body.logo_storage_path
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
    
    const { email, client_id, client_name, agent_name, agent_description, logo_url, logo_storage_path } = body;
    
    // Sanitize agent name to prevent SQL errors - replace double quotes with single quotes
    const sanitizedAgentName = agent_name ? agent_name.replace(/"/g, "'") : agent_name;
    
    console.log("Using sanitized agent name:", sanitizedAgentName);
    
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
    
    // Check if user already exists
    console.log("Checking if user exists:", email);
    const { data: { users: existingUsers }, error: userCheckError } = await supabase.auth.admin.listUsers();
    
    if (userCheckError) {
      console.error("Error checking existing user:", userCheckError);
      throw new Error(`Failed to check existing user: ${userCheckError.message}`);
    }

    const existingUser = existingUsers?.find(u => u.email === email);
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
      console.log("User already exists, updating metadata and password:", email);
      userId = existingUser.id;
      
      // Update user metadata with sanitized agent name
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: tempPassword,
          user_metadata: { 
            client_id,
            client_name,
            agent_name: sanitizedAgentName, // Use sanitized agent name
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
      console.log("Creating new user:", email);
      
      // Create user with admin API to ensure proper auth setup
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { 
          client_id,
          client_name,
          agent_name: sanitizedAgentName, // Use sanitized agent name
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
    
    // Create user role for this user
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
    
    // Generate AI prompt with sanitized agent name
    const aiPrompt = generateAiPrompt(sanitizedAgentName, agent_description || "", client_name || "");
    console.log("Generated AI prompt:", aiPrompt);
    
    // Create AI agent entry with sanitized agent name
    try {
      console.log("Creating AI agent for client:", client_id);
      console.log("Using logo URL:", logo_url);
      console.log("Using logo storage path:", logo_storage_path);
      
      const { error: agentError } = await supabase
        .from("ai_agents")
        .insert({
          client_id: client_id,
          name: sanitizedAgentName, // Use sanitized agent name
          agent_description: agent_description || "",
          ai_prompt: aiPrompt,
          logo_url: logo_url || "",
          logo_storage_path: logo_storage_path || "",
          settings: {
            agent_description: agent_description || "",
            client_name: client_name,
            logo_url: logo_url || "",
            logo_storage_path: logo_storage_path || "",
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
          agent_description: agent_description,
          logo_url: logo_url
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
