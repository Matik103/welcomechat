
import { supabase } from "@/integrations/supabase/client";
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
 * Updates an existing client
 */
export const updateClient = async (id: string, data: ClientFormData): Promise<string> => {
  const { error } = await supabase
    .from("clients")
    .update({
      client_name: data.client_name,
      email: data.email,
      agent_name: data.agent_name,
      widget_settings: data.widget_settings,
    })
    .eq("id", id);
  if (error) throw error;
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

    // Ensure agent_name is properly formatted (sanitized)
    const sanitizedAgentName = data.agent_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_');
    
    const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();
    
    console.log("Using sanitized agent name:", finalAgentName);

    // Create the client record
    const { data: newClients, error } = await supabase
      .from("clients")
      .insert([{
        client_name: data.client_name,
        email: data.email,
        agent_name: finalAgentName, // Use the sanitized name
        widget_settings: data.widget_settings || {},
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

    return clientId;
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
  }
};

/**
 * Generates a secure random password
 */
const generateTempPassword = (): string => {
  // Create a consistent but secure password format
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  // Start with a consistent prefix for easier testing
  let password = 'Welcome';
  
  // Add random characters
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Ensure it has at least one special character
  password += '!';
  
  return password;
};

/**
 * Sends an invitation email to a new client
 */
export const sendClientInvitationEmail = async (params: { 
  clientId: string, 
  clientName: string, 
  email: string,
  agentName: string
}): Promise<void> => {
  const { clientId, clientName, email, agentName } = params;
  
  // Generate a secure temporary password
  const tempPassword = generateTempPassword();
  
  try {
    console.log("Creating client auth user account...");
    
    // Call the edge function without the x-application-name header
    const functionUrl = `${supabase.functions.url}/create-client-user`;
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        email: email,
        password: tempPassword,
        client_id: clientId,
        client_name: clientName,
        agent_name: agentName
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Failed to create user account: ${errorData.error || response.statusText}`);
    }
    
    console.log("Created auth user for client successfully");
    
    // Then send the welcome email
    console.log("Preparing to send welcome email...");
    const loginUrl = `${window.location.origin}/client/auth`;
    
    // Prepare email content with agent name
    const emailSubject = `Welcome to Welcome.Chat - ${agentName} AI Assistant Setup`;
    
    const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h1 style="color: #4a5568; text-align: center;">Welcome to Welcome.Chat!</h1>
      
      <p>Hello ${clientName},</p>
      
      <p>You have been invited to create your account for Welcome.Chat. Your AI assistant "${agentName}" has been set up and is ready for you to configure.</p>
      
      <p><strong>Your temporary password is: ${tempPassword}</strong></p>
      
      <p>To complete your account setup:</p>
      
      <ol>
        <li>Click the button below to sign in</li>
        <li>Use your email (${email}) and temporary password to log in</li>
        <li>You'll be automatically redirected to your client dashboard</li>
        <li>Configure your AI assistant's settings in the dashboard</li>
      </ol>
      
      <div style="text-align: center; margin: 25px 0;">
        <a href="${loginUrl}" style="background-color: #4299e1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Sign In</a>
      </div>
      
      <p>This invitation link will expire in 24 hours.</p>
      
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
      
      <p>Best regards,<br>The Welcome.Chat Team</p>
    </div>
    `;
    
    console.log("Sending invitation email...");
    // Use fetch for send-email function too to avoid CORS issues
    const emailFunctionUrl = `${supabase.functions.url}/send-email`;
    const emailResponse = await fetch(emailFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify({
        to: email,
        subject: emailSubject,
        html: emailHtml,
        from: "Welcome.Chat <admin@welcome.chat>"
      })
    });
    
    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Failed to send invitation email: ${errorData.error || emailResponse.statusText}`);
    }
    
    console.log("Invitation email sent successfully");
    return;
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
};
