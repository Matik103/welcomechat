import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { Client, ClientFormData } from "@/types/client";
import { toast } from "sonner";

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
function sanitizeForSQL(str: string): string {
  if (!str) return "";
  
  try {
    // Remove any existing SQL escaping
    let sanitized = str.replace(/''/g, "'");
    
    // Escape single quotes by doubling them
    sanitized = sanitized.replace(/'/g, "''");
    
    // Remove any double quotes
    sanitized = sanitized.replace(/"/g, "");
    
    // Remove any backslashes
    sanitized = sanitized.replace(/\\/g, "");
    
    // Trim whitespace
    sanitized = sanitized.trim();
    
    console.log("Sanitization steps:", {
      original: str,
      sanitized,
    });
    
    return sanitized;
  } catch (error) {
    console.error("Error sanitizing string:", error);
    return "";
  }
}

/**
 * Updates an existing client 
 */
export const updateClient = async (id: string, data: ClientFormData): Promise<string> => {
  console.log("Updating client with data:", data);
  
  // Extra safety - sanitize again to be absolutely sure
  const sanitizedAgentDescription = sanitizeForSQL(data.agent_description);
  
  // Update the client record (including logo fields and agent_name)
  const { error } = await supabase
    .from("clients")
    .update({
      client_name: data.client_name,
      email: data.email,
      agent_name: data.agent_name || "AI Assistant", // Use the provided agent_name or default
      // Store agent_description, agent_name and logo info in widget_settings
      widget_settings: typeof data.widget_settings === 'object' && data.widget_settings !== null 
        ? { 
            ...data.widget_settings,
            agent_name: data.agent_name || "AI Assistant",
            agent_description: sanitizedAgentDescription,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path
          } 
        : { 
            agent_name: data.agent_name || "AI Assistant",
            agent_description: sanitizedAgentDescription,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path
          }
    })
    .eq("id", id);
  if (error) throw error;
  
  // Update agent name, description and logo in ai_agents table
  try {
    // Check if AI agent exists first
    const { data: agentData } = await supabase
      .from("ai_agents")
      .select("id")
      .eq("client_id", id)
      .maybeSingle();
      
    if (agentData?.id) {
      // Update existing AI agent with agent_name
      await supabase
        .from("ai_agents")
        .update({
          name: data.agent_name || "AI Assistant",
          agent_description: sanitizedAgentDescription,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path,
          settings: {
            agent_name: data.agent_name || "AI Assistant",
            agent_description: sanitizedAgentDescription,
            client_name: data.client_name,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path,
            updated_at: new Date().toISOString()
          }
        })
        .eq("client_id", id);
    } else {
      // Create new AI agent if it doesn't exist, using the provided or default agent name
      await supabase
        .from("ai_agents")
        .insert({
          client_id: id,
          name: data.agent_name || "AI Assistant",
          content: "",
          agent_description: sanitizedAgentDescription,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path,
          settings: {
            agent_name: data.agent_name || "AI Assistant",
            agent_description: sanitizedAgentDescription,
            client_name: data.client_name,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path,
            updated_at: new Date().toISOString()
          }
        });
    }
  } catch (agentError) {
    console.error("Error updating agent name, description or logo:", agentError);
    // Continue even if agent update fails
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
 * Generates a temporary password for new clients
 */
function generateTempPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

/**
 * Creates a new client
 */
export const createClient = async (clientData: {
  clientName: string;
  email: string;
  agentName?: string;
  agentDescription?: string;
  logoUrl?: string;
  logoStoragePath?: string;
  chatColor?: string;
  backgroundColor?: string;
  textColor?: string;
  secondaryColor?: string;
  position?: string;
  welcomeText?: string;
  responseTimeText?: string;
}): Promise<Client | null> => {
  try {
    console.log("Starting client creation with data:", clientData);
    
    const {
      clientName,
      email,
      agentName,
      agentDescription,
      logoUrl,
      logoStoragePath,
      chatColor,
      backgroundColor,
      textColor,
      secondaryColor,
      position,
      welcomeText,
      responseTimeText
    } = clientData;

    // Generate temporary password
    const tempPassword = generateTempPassword();
    console.log("Generated temporary password");

    // Prepare widget settings
    const widgetSettings = {
      agent_name: agentName,
      agent_description: agentDescription,
      logo_url: logoUrl,
      logo_storage_path: logoStoragePath,
      chat_color: chatColor,
      background_color: backgroundColor,
      text_color: textColor,
      secondary_color: secondaryColor,
      position: position,
      welcome_text: welcomeText,
      response_time_text: responseTimeText
    };
    console.log("Prepared widget settings:", widgetSettings);

    // Insert new client with only essential fields
    console.log("Attempting to insert new client...");
    const { data: newClient, error: insertError } = await supabase
      .from("clients")
      .insert({
        client_name: clientName,
        email: email,
        status: 'active',
        agent_name: agentName || 'AI Assistant', // Required field
        widget_settings: widgetSettings, // Save widget settings in clients table
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating client:", insertError);
      throw new Error(`Failed to create client: ${insertError.message}`);
    }
    console.log("Client created successfully:", newClient);

    // Create AI agent with all settings
    console.log("Attempting to create AI agent...");
    const { error: agentError } = await supabase
      .from("ai_agents")
      .insert({
        client_id: newClient.id,
        name: agentName || 'AI Assistant',
        agent_description: agentDescription || "",
        content: "",
        interaction_type: "config",
        settings: {
          agent_name: agentName || 'AI Assistant',
          agent_description: agentDescription,
          logo_url: logoUrl,
          logo_storage_path: logoStoragePath,
          client_id: newClient.id,
          client_name: clientName,
          created_at: new Date().toISOString()
        },
        widget_settings: widgetSettings,
        logo_url: logoUrl || "",
        logo_storage_path: logoStoragePath || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (agentError) {
      console.error("Error creating AI agent:", agentError);
      // Even if agent creation fails, we still want to return the client
      return newClient;
    }
    console.log("AI agent created successfully");

    // Send invitation email
    try {
      console.log("Attempting to send invitation email...");
      await sendClientInvitationEmail({
        clientId: newClient.id,
        clientName: clientName,
        email: email,
        tempPassword: tempPassword
      });
      console.log("Invitation email sent successfully");
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // Don't throw here, as the client and agent were created successfully
    }

    return newClient;
  } catch (error) {
    console.error("Error in createClient:", error);
    return null;
  }
};

/**
 * Sends an invitation email to a new client
 */
export const sendClientInvitationEmail = async (params: {
  clientId: string;
  clientName: string;
  email: string;
  tempPassword: string;
}): Promise<void> => {
  const { clientId, clientName, email, tempPassword } = params;
  
  try {
    console.log("Starting to send invitation email to:", email);
    
    // Get the current user's email for the from address
    const { data: { user } } = await supabase.auth.getUser();
    const fromEmail = user?.email || "admin@welcome.chat";
    console.log("Using from email:", fromEmail);

    // Prepare the email content
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; margin-bottom: 20px;">Welcome to Welcome.Chat!</h1>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${clientName},
        </p>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Your Welcome.Chat account has been created. You can now access your dashboard and start managing your AI agent.
        </p>
        
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px; color: #4a5568; font-size: 14px;">Your Account Details:</p>
          <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 16px;">Email: ${email}</p>
          
          <p style="margin: 0 0 10px; color: #4a5568; font-size: 14px;">Temporary Password:</p>
          <p style="margin: 0; color: #2d3748; font-weight: 600; font-size: 16px; font-family: monospace; background: #edf2f7; padding: 8px 12px; border-radius: 4px;">${tempPassword}</p>
        </div>
        
        <p style="color: #4a5568; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
          This invitation will expire in 48 hours. For security reasons, please change your password after your first login. If you didn't request this account, please ignore this email.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${SUPABASE_URL}/auth/login" style="display: inline-block; background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Login to Your Account</a>
        </div>
      </div>
    `;
    console.log("Email content prepared");

    // Send the email using the Edge Function
    console.log("Sending email via Edge Function...");
    const emailResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        to: email,
        subject: "Welcome to Welcome.Chat - Your Account Details",
        html: emailContent,
        from: `Welcome.Chat <${fromEmail}>`
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email sending failed:", errorText);
      throw new Error(`Failed to send invitation email (HTTP ${emailResponse.status})`);
    }

    const responseData = await emailResponse.json();
    console.log("Email sent successfully:", responseData);

    // Log the email sending activity
    console.log("Logging email sending activity...");
    await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: "client_created",
      description: "sent an invitation email",
      metadata: { email }
    });
    console.log("Activity logged successfully");

  } catch (error) {
    console.error("Error sending invitation:", error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
};

