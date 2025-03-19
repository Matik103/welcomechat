import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/integrations/supabase/client";
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
 * Helper function to sanitize strings for SQL queries
 */
const sanitizeForSQL = (value: string | undefined): string | undefined => {
  if (!value) return value;
  // Replace double quotes with single quotes to prevent SQL errors
  return value.replace(/"/g, "'");
};

/**
 * Updates an existing client 
 */
export const updateClient = async (id: string, data: ClientFormData): Promise<string> => {
  console.log("Updating client with data:", data);
  
  // Sanitize agent_name to prevent SQL errors
  const sanitizedAgentName = sanitizeForSQL(data.agent_name);
  
  // Update the client record (including logo fields)
  const { error } = await supabase
    .from("clients")
    .update({
      client_name: data.client_name,
      email: data.email,
      agent_name: sanitizedAgentName,
      // Store agent_description and logo info in widget_settings
      widget_settings: typeof data.widget_settings === 'object' && data.widget_settings !== null 
        ? { 
            ...data.widget_settings,
            agent_description: data.agent_description,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path
          } 
        : { 
            agent_description: data.agent_description,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path
          }
    })
    .eq("id", id);
  if (error) throw error;
  
  // Update agent description and logo in ai_agents table if agent_name exists
  if (sanitizedAgentName) {
    try {
      // Generate AI prompt based on agent name and description
      const aiPrompt = generateAiPrompt(sanitizedAgentName, data.agent_description || "");
      
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
            name: sanitizedAgentName,
            agent_description: data.agent_description,
            ai_prompt: aiPrompt,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path,
            settings: {
              agent_description: data.agent_description,
              client_name: data.client_name,
              logo_url: data.logo_url,
              logo_storage_path: data.logo_storage_path,
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
            name: sanitizedAgentName,
            content: "",
            agent_description: data.agent_description,
            ai_prompt: aiPrompt,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path,
            settings: {
              agent_description: data.agent_description,
              client_name: data.client_name,
              logo_url: data.logo_url,
              logo_storage_path: data.logo_storage_path,
              updated_at: new Date().toISOString()
            }
          });
      }
    } catch (agentError) {
      console.error("Error updating agent description or logo:", agentError);
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
 * Creates a new client
 */
export const createClient = async (data: ClientFormData): Promise<string> => {
  try {
    console.log("Creating client with data:", data);
    
    // Sanitize agent_name to prevent SQL errors
    const sanitizedAgentName = sanitizeForSQL(data.agent_name) || 'agent_' + Date.now();
    
    console.log("Using sanitized agent name:", sanitizedAgentName);
    
    // Prepare widget settings, ensuring it's an object
    const widgetSettings = typeof data.widget_settings === 'object' && data.widget_settings !== null 
      ? { 
          ...data.widget_settings,
          agent_description: data.agent_description,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path 
        } 
      : { 
          agent_description: data.agent_description,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path
        };

    // Create the client record
    const { data: newClients, error } = await supabase
      .from("clients")
      .insert([{
        client_name: data.client_name,
        email: data.email,
        agent_name: sanitizedAgentName,
        // Store the agent_description and logo in widget_settings
        widget_settings: widgetSettings,
        status: 'active',
        website_url_refresh_rate: 60,
        drive_link_refresh_rate: 60,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('*');

    if (error) {
      console.error("Error creating client:", error);
      throw error;
    }

    if (!newClients || newClients.length === 0) {
      throw new Error("Failed to create client - no data returned");
    }

    const clientId = newClients[0].id;
    console.log("Created client with ID:", clientId);

    // Create Supabase auth user immediately after client creation
    try {
      const sessionResponse = await supabase.auth.getSession();
      const accessToken = sessionResponse.data.session?.access_token;
      
      if (!accessToken) {
        throw new Error("No auth session found - please log in again");
      }

      // Create the auth user using the edge function with the correct URL
      const functionUrl = `${SUPABASE_URL}/functions/v1/create-client-user`;
      console.log("Calling edge function at:", functionUrl);
      
      const createUserResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          email: data.email,
          client_id: clientId,
          client_name: data.client_name,
          agent_name: sanitizedAgentName,
          agent_description: data.agent_description || "",
          logo_url: data.logo_url || "",
          logo_storage_path: data.logo_storage_path || ""
        })
      });

      if (!createUserResponse.ok) {
        const errorText = await createUserResponse.text();
        console.error("Error response from create-client-user:", errorText);
        throw new Error(`Failed to create auth user: ${errorText}`);
      }

      const responseText = await createUserResponse.text();
      console.log("Create user response:", responseText);
      
      const responseData = JSON.parse(responseText);
      const tempPassword = responseData.temp_password;

      if (!tempPassword) {
        console.error("Response data:", responseData);
        throw new Error('No temporary password received from server');
      }

      // Send welcome email with the temporary password
      await sendClientInvitationEmail({
        clientId,
        clientName: data.client_name,
        email: data.email,
        agentName: sanitizedAgentName,
        tempPassword
      });

    } catch (authError) {
      console.error("Error setting up client authentication:", authError);
      // Delete the client record if auth setup fails
      await supabase.from("clients").delete().eq("id", clientId);
      throw new Error(`Failed to set up client authentication: ${authError.message}`);
    }

    return clientId;
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
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
    
    // Use fetch for send-email function to avoid CORS issues
    const emailResponse = await fetch(`https://mgjodiqecnnltsgorife.supabase.co/functions/v1/send-email`, {
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
      throw new Error(`Failed to send invitation email (HTTP ${emailResponse.status})`);
    }
    
    console.log("Invitation email sent successfully");
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
};
