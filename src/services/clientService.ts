
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
      agent_description: sanitizedAgentDescription, // Add agent_description directly to clients table
      logo_url: data.logo_url,
      logo_storage_path: data.logo_storage_path,
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
 * Creates a new client
 */
export const createClient = async (formData: ClientFormData): Promise<string> => {
  try {
    // Map the formData to match the DB function parameters
    const agentName = formData.agent_name || 'AI Assistant';
    
    // Use the RPC function to create client and AI agent together
    const { data, error } = await supabase.rpc('create_new_client', {
      p_client_name: formData.client_name,
      p_email: formData.email,
      p_agent_name: agentName,
      p_agent_description: formData.agent_description,
      p_logo_url: formData.logo_url,
      p_logo_storage_path: formData.logo_storage_path,
      p_widget_settings: typeof formData.widget_settings === 'object' ? 
        {
          ...formData.widget_settings,
          agent_name: agentName,
          agent_description: formData.agent_description
        } : 
        {
          agent_name: agentName,
          agent_description: formData.agent_description,
          logo_url: formData.logo_url,
          logo_storage_path: formData.logo_storage_path
        },
      p_status: 'active'
    });
    
    if (error) {
      console.error("Error creating client:", error);
      throw error;
    }
    
    console.log("Client created successfully with ID:", data);
    
    // Send invitation email
    await sendClientInvitationEmail({
      clientId: data,
      clientName: formData.client_name,
      email: formData.email,
      agentName: agentName
    });
    
    return data;
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
  }
};

/**
 * Sends an invitation email to a new client using Resend.com
 */
export const sendClientInvitationEmail = async (params: {
  clientId: string;
  clientName: string;
  email: string;
  agentName?: string;
}): Promise<void> => {
  const { clientId, clientName, email, agentName } = params;
  
  try {
    console.log("Starting to send invitation email to:", email);
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #2d3748; margin-bottom: 20px;">Welcome to Welcome.Chat!</h1>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hello ${clientName},
        </p>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Your Welcome.Chat account has been created. You can now access your dashboard and start managing your ${agentName || 'AI'} agent.
        </p>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          A welcome email with your login credentials will be sent separately.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${SUPABASE_URL}/auth/login" style="display: inline-block; background: #4299e1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Login to Your Account</a>
        </div>
      </div>
    `;
    
    // Send the email directly using Resend.com API via edge function
    console.log("Calling send-email edge function...");
    
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
        from: "Welcome.Chat <onboarding@resend.dev>"
      })
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error("Email sending failed:", errorText);
      throw new Error(`Failed to send invitation email (HTTP ${emailResponse.status}): ${errorText}`);
    }

    const responseData = await emailResponse.json();
    console.log("Email sent successfully:", responseData);

    // Log the email sending activity
    await supabase.from("client_activities").insert({
      client_id: clientId,
      activity_type: "client_created",
      description: "Invitation email sent to " + email,
      metadata: { email }
    });
    
    // Also create a user account for the client
    console.log("Creating client user account...");
    
    const createUserResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-client-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        email,
        client_id: clientId,
        client_name: clientName,
        agent_name: agentName || 'AI Assistant'
      })
    });
    
    if (!createUserResponse.ok) {
      const errorText = await createUserResponse.text();
      console.error("User creation failed:", errorText);
      throw new Error(`Failed to create client user (HTTP ${createUserResponse.status}): ${errorText}`);
    }
    
    const userData = await createUserResponse.json();
    console.log("User created successfully:", userData);

  } catch (error) {
    console.error("Error sending invitation:", error);
    throw new Error(`Failed to send invitation: ${error.message}`);
  }
};
