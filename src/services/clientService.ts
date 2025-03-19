import { supabase } from "@/integrations/supabase/client";
import { Client, ClientFormData } from "@/types/client";
import { toast } from "sonner";
import { generateAiPrompt } from "@/utils/activityTypeUtils";

/**
 * Fetches a single client by ID
 */
export const getClientById = async (id: string): Promise<Client | null> => {
  if (!id) return null;
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Client;
};

/**
 * Updates an existing client
 */
export const updateClient = async (id: string, data: ClientFormData): Promise<string> => {
  console.log("Updating client with data:", data);
  
  // Sanitize all string values to prevent SQL injection
  const sanitizedData = {
    client_name: sanitizeStringForSQL(data.client_name),
    email: sanitizeStringForSQL(data.email),
    agent_name: data.agent_name ? sanitizeStringForSQL(data.agent_name) : null,
    // Store agent_description in widget_settings if needed
    widget_settings: typeof data.widget_settings === 'object' && data.widget_settings !== null 
      ? { 
          ...data.widget_settings,
          agent_description: data.agent_description ? sanitizeStringForSQL(data.agent_description) : null
        } 
      : { 
          agent_description: data.agent_description ? sanitizeStringForSQL(data.agent_description) : null
        }
  };
  
  // Update the client record (excluding agent_description)
  const { error } = await supabase
    .from("clients")
    .update(sanitizedData)
    .eq("id", id);
  if (error) throw error;
  
  // Update agent description in ai_agents table if agent_name exists
  if (data.agent_name && data.agent_description !== undefined) {
    try {
      // Generate AI prompt based on agent name and description
      const aiPrompt = generateAiPrompt(
        sanitizeStringForSQL(data.agent_name), 
        sanitizeStringForSQL(data.agent_description || "")
      );
      
      console.log("Generated AI prompt:", aiPrompt);
      
      // Check if AI agent exists first
      const { data: agentData } = await supabase
        .from("ai_agents")
        .select("id")
        .eq("client_id", id)
        .maybeSingle();
        
      if (agentData?.id) {
        // Update existing AI agent 
        await supabase
          .from("ai_agents")
          .update({
            name: sanitizeStringForSQL(data.agent_name),
            agent_description: sanitizeStringForSQL(data.agent_description || ""),
            ai_prompt: sanitizeStringForSQL(aiPrompt),
            settings: {
              agent_description: sanitizeStringForSQL(data.agent_description || ""),
              client_name: sanitizeStringForSQL(data.client_name),
              updated_at: new Date().toISOString()
            }
          })
          .eq("client_id", id);
      } else {
        // Create new AI agent if it doesn't exist
        await supabase
          .from("ai_agents")
          .insert({
            client_id: id,
            name: sanitizeStringForSQL(data.agent_name),
            content: "",
            agent_description: sanitizeStringForSQL(data.agent_description || ""),
            ai_prompt: sanitizeStringForSQL(aiPrompt),
            settings: {
              agent_description: sanitizeStringForSQL(data.agent_description || ""),
              client_name: sanitizeStringForSQL(data.client_name),
              updated_at: new Date().toISOString()
            }
          });
      }
    } catch (agentError) {
      console.error("Error updating agent description:", agentError);
      // Continue even if agent update fails
    }
  }
  
  return id;
};

/**
 * Logs client update activity
 */
export const logClientUpdateActivity = async (id: string): Promise<void> => {
  try {
    const user = await supabase.auth.getUser();
    const isClientUser = user.data.user?.user_metadata?.client_id === id;
    if (isClientUser) {
      await supabase.from("client_activities").insert({
        client_id: id,
        activity_type: "client_updated",
        description: "updated their account information",
        metadata: {}
      });
    }
  } catch (activityError) {
    console.error("Error logging activity:", activityError);
  }
};

/**
 * Helper function to sanitize string values for SQL
 * This prevents SQL syntax errors when strings contain quotes
 */
export const sanitizeStringForSQL = (value: string): string => {
  if (!value) return "";
  
  // First, trim the value
  let sanitized = value.trim();
  
  // Replace single and double quotes, backticks, and backslashes
  sanitized = sanitized.replace(/['"`\\]/g, '');
  
  console.log(`Sanitized "${value}" to "${sanitized}"`);
  
  return sanitized;
};

/**
 * Creates a new client
 */
export const createClient = async (data: ClientFormData): Promise<string> => {
  try {
    console.log("Creating client with data:", data);

    // Strongly sanitize all string values to prevent SQL syntax errors
    const sanitizedClientName = sanitizeStringForSQL(data.client_name);
    const sanitizedEmail = sanitizeStringForSQL(data.email);
    const sanitizedAgentName = data.agent_name ? sanitizeStringForSQL(data.agent_name) : 'agent_' + Date.now();
    const sanitizedAgentDescription = data.agent_description ? sanitizeStringForSQL(data.agent_description) : '';
    
    console.log("Using sanitized values:", {
      client_name: sanitizedClientName,
      email: sanitizedEmail,
      agent_name: sanitizedAgentName,
      agent_description: sanitizedAgentDescription
    });
    
    // Prepare widget settings, ensuring it's an object
    const widgetSettings = typeof data.widget_settings === 'object' && data.widget_settings !== null 
      ? { 
          ...data.widget_settings,
          agent_description: sanitizedAgentDescription
        } 
      : { 
          agent_description: sanitizedAgentDescription
        };

    // Create the client record with sanitized values using a custom SQL function
    // This avoids SQL syntax issues by letting the database handle parameter binding
    const { data: clientId, error: functionError } = await supabase.rpc(
      'create_new_client',
      {
        p_client_name: sanitizedClientName,
        p_email: sanitizedEmail,
        p_agent_name: sanitizedAgentName,
        p_widget_settings: widgetSettings,
        p_status: 'active',
        p_website_url_refresh_rate: 60,
        p_drive_link_refresh_rate: 60
      }
    );

    if (functionError) {
      console.error("Error creating client with RPC:", functionError);
      
      // Fall back to direct insert if RPC fails or doesn't exist
      console.log("Falling back to direct insert");
      
      const { data: insertResult, error: insertError } = await supabase
        .from("clients")
        .insert({
          client_name: sanitizedClientName,
          email: sanitizedEmail,
          agent_name: sanitizedAgentName,
          widget_settings: widgetSettings,
          status: 'active',
          website_url_refresh_rate: 60,
          drive_link_refresh_rate: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (insertError) {
        console.error("Error in fallback client creation:", insertError);
        throw insertError;
      }
      
      if (!insertResult || insertResult.length === 0) {
        throw new Error("Failed to create client - no data returned from insert");
      }
      
      const newClientId = insertResult[0].id;
      console.log("Created client with ID:", newClientId);
      
      // Continue with the rest of the function using the clientId from direct insert
      return await continueClientCreation(
        newClientId, 
        sanitizedClientName, 
        sanitizedEmail, 
        sanitizedAgentName, 
        sanitizedAgentDescription
      );
    }

    console.log("Created client with ID from RPC:", clientId);

    return await continueClientCreation(
      clientId, 
      sanitizedClientName, 
      sanitizedEmail, 
      sanitizedAgentName, 
      sanitizedAgentDescription
    );
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
  }
};

/**
 * Continues the client creation process after the initial client record is created
 * This is extracted to reduce duplication between the RPC and direct insert paths
 */
const continueClientCreation = async (
  clientId: string, 
  clientName: string, 
  email: string, 
  agentName: string, 
  agentDescription: string
): Promise<string> => {
  try {
    // Create Supabase auth user
    const sessionResponse = await supabase.auth.getSession();
    const accessToken = sessionResponse.data.session?.access_token;
    
    if (!accessToken) {
      throw new Error("No auth session found - please log in again");
    }

    // Create the auth user using the edge function - retry up to 3 times with delay
    let createUserResponse;
    let attempts = 0;
    const maxAttempts = 3;
    
    // Import the SUPABASE_URL from the client file
    const { SUPABASE_URL } = await import("@/integrations/supabase/client");
    
    while (attempts < maxAttempts) {
      try {
        createUserResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-client-user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            email: email,
            client_id: clientId,
            client_name: clientName,
            agent_name: agentName,
            agent_description: agentDescription
          })
        });
        
        if (createUserResponse.ok) {
          break; // Success, exit the retry loop
        } else {
          const errorText = await createUserResponse.text();
          console.error(`Attempt ${attempts + 1}/${maxAttempts} failed:`, errorText);
          
          if (attempts === maxAttempts - 1) {
            throw new Error(`Failed to create auth user after ${maxAttempts} attempts: ${errorText}`);
          }
        }
      } catch (fetchError) {
        console.error(`Attempt ${attempts + 1}/${maxAttempts} fetch error:`, fetchError);
        
        if (attempts === maxAttempts - 1) {
          throw fetchError;
        }
      }
      
      attempts++;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
    }
    
    if (!createUserResponse || !createUserResponse.ok) {
      throw new Error("Failed to create auth user - no valid response received");
    }

    const responseText = await createUserResponse.text();
    console.log("Create user response:", responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error parsing response:", parseError);
      throw new Error("Invalid response from server: " + responseText);
    }
    
    const tempPassword = responseData.temp_password;

    if (!tempPassword) {
      console.error("Response data:", responseData);
      throw new Error('No temporary password received from server');
    }

    // Send welcome email with the temporary password - also retry this operation
    attempts = 0;
    let emailSuccess = false;
    let emailError = null;
    
    while (attempts < maxAttempts && !emailSuccess) {
      try {
        await sendClientInvitationEmail({
          clientId,
          clientName,
          email,
          agentName, 
          tempPassword
        });
        emailSuccess = true;
      } catch (sendError) {
        console.error(`Attempt ${attempts + 1}/${maxAttempts} email error:`, sendError);
        emailError = sendError;
        
        if (attempts === maxAttempts - 1) {
          console.error("Failed to send invitation email after all attempts");
          // We will continue even if email fails - user can resend later
        }
      }
      
      attempts++;
      if (!emailSuccess && attempts < maxAttempts) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      }
    }

    // Return success with email status
    return clientId;
  } catch (error) {
    console.error("Error in continueClientCreation:", error);
    
    // Try to delete the client record if auth setup fails
    try {
      await supabase.from("clients").delete().eq("id", clientId);
    } catch (deleteError) {
      console.error("Error deleting partial client:", deleteError);
    }
    
    throw new Error(`Failed to set up client authentication: ${error.message}`);
  }
};

/**
 * Generates a secure temporary password
 */
const generateTempPassword = (): string => {
  // Create a consistent and secure temporary password
  // Format: Welcome + current year + ! (e.g., Welcome2024!)
  const year = new Date().getFullYear();
  return `Welcome${year}!`;
};

/**
 * Sends an invitation email to a new client
 */
export const sendClientInvitationEmail = async (params: { 
  clientId: string, 
  clientName: string, 
  email: string,
  agentName: string,
  tempPassword: string
}): Promise<void> => {
  const { clientId, clientName, email, agentName, tempPassword } = params;
  
  try {
    console.log("Preparing to send welcome email...");
    const loginUrl = `${window.location.origin}/client/dashboard`;
    
    // Prepare email content
    const emailSubject = `Welcome to Welcome.Chat!`;
    
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    </head>
    <body style="background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background-color: #4299e1; padding: 30px 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">Welcome to Welcome.Chat!</h1>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px;">
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hello ${clientName},</p>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Your AI assistant account has been created and is ready for configuration. Here are your login credentials:</p>
          
          <!-- Credentials Box -->
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="margin: 0 0 10px; color: #4a5568; font-size: 14px;">Email Address:</p>
            <p style="margin: 0 0 20px; color: #2d3748; font-weight: 600; font-size: 16px;">${email}</p>
            
            <p style="margin: 0 0 10px; color: #4a5568; font-size: 14px;">Temporary Password:</p>
            <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 16px; font-family: monospace; background: #edf2f7; padding: 8px 12px; border-radius: 4px;">${tempPassword}</p>
          </div>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">To get started:</p>
          
          <ol style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 30px; padding-left: 20px;">
            <li style="margin-bottom: 10px;">Click the "Sign In" button below</li>
            <li style="margin-bottom: 10px;">Enter your email and temporary password exactly as shown above</li>
            <li style="margin-bottom: 10px;">You'll be taken to your client dashboard</li>
            <li style="margin-bottom: 10px;">Configure your AI assistant's settings</li>
          </ol>
          
          <!-- CTA Button -->
          <div style="text-align: center; margin: 35px 0;">
            <a href="${loginUrl}" style="display: inline-block; background-color: #4299e1; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">Sign In</a>
          </div>
          
          <!-- Security Notice -->
          <div style="border-left: 4px solid #f6ad55; background-color: #fffaf0; padding: 15px; margin: 30px 0; color: #744210; font-size: 14px; line-height: 1.6;">
            <p style="margin: 0 0 10px;"><strong>Security Notice:</strong></p>
            <p style="margin: 0;">This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.</p>
          </div>
          
          <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">Best regards,<br>The Welcome.Chat Team</p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 14px; margin: 0;">© ${new Date().getFullYear()} Welcome.Chat. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
    `;
    
    // Get the session token
    const sessionResponse = await supabase.auth.getSession();
    const accessToken = sessionResponse.data.session?.access_token;
    
    if (!accessToken) {
      throw new Error("No auth session found - please log in again");
    }
    
    // Import the SUPABASE_URL from the client file
    const { SUPABASE_URL } = await import("@/integrations/supabase/client");
    
    // Use fetch for send-email function to avoid CORS issues
    const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to: [email],
        subject: emailSubject,
        html: emailHtml,
        from: "Welcome.Chat <admin@welcome.chat>"
      })
    });
    
    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      throw new Error(`Failed to send invitation email (HTTP ${emailResponse.status}): ${errorText}`);
    }
    
    console.log("Invitation email sent successfully");
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
};
