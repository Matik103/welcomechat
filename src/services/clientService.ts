
import { supabase } from "@/integrations/supabase/client";
import { ClientFormData } from "@/types/client";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { ExtendedActivityType } from "@/types/activity";

// Create a new client
export const createClient = async (data: ClientFormData): Promise<string> => {
  console.log("Creating client with data:", data);
  
  try {
    // Use the database function to create client and AI agent records
    const { data: result, error } = await supabase.rpc('create_new_client', {
      p_client_name: data.client_name,
      p_email: data.email,
      p_agent_name: data.agent_name || 'AI Assistant',
      p_agent_description: data.agent_description || '',
      p_logo_url: data.logo_url || '',
      p_logo_storage_path: data.logo_storage_path || '',
      p_widget_settings: data.widget_settings || {}
    });

    if (error) {
      console.error("Error creating client:", error);
      throw error;
    }

    console.log("Client created successfully:", result);
    
    // Send invitation email
    try {
      await sendInvitationEmail(data.email, data.client_name);
      console.log("Invitation email sent successfully");
    } catch (emailError) {
      console.error("Error sending invitation email:", emailError);
      // We don't throw here as we want to return the client ID even if email fails
    }

    return result;
  } catch (error) {
    console.error("Error in createClient:", error);
    throw error;
  }
};

// Update an existing client
export const updateClient = async (id: string, data: ClientFormData): Promise<string> => {
  console.log("Updating client with ID:", id, "Data:", data);
  
  try {
    // Prepare widget_settings object
    const widgetSettings = {
      ...(data.widget_settings || {}),
      agent_description: data.agent_description || "",
      logo_url: data.logo_url || "",
      logo_storage_path: data.logo_storage_path || ""
    };
    
    // First update the client record
    const { error: clientError } = await supabase
      .from("clients")
      .update({
        client_name: data.client_name,
        email: data.email,
        agent_name: data.agent_name || 'AI Assistant',
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path,
        widget_settings: widgetSettings,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (clientError) {
      console.error("Error updating client:", clientError);
      throw clientError;
    }

    // Then sync changes to the ai_agents table
    const { error: agentError } = await supabase
      .from("ai_agents")
      .update({
        name: data.agent_name || 'AI Assistant',
        agent_description: data.agent_description,
        logo_url: data.logo_url,
        logo_storage_path: data.logo_storage_path,
        settings: {
          agent_name: data.agent_name || 'AI Assistant',
          agent_description: data.agent_description || '',
          client_name: data.client_name,
          logo_url: data.logo_url || '',
          logo_storage_path: data.logo_storage_path || '',
          updated_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq("client_id", id);

    if (agentError) {
      console.error("Error updating AI agent:", agentError);
      // We continue even if there's an error updating the agent
    }

    return id;
  } catch (error) {
    console.error("Error in updateClient:", error);
    throw error;
  }
};

// Send invitation email to new client
export const sendInvitationEmail = async (email: string, clientName: string): Promise<void> => {
  try {
    console.log(`Sending invitation email to ${email} for client ${clientName}`);
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: email,
        subject: `Welcome to the AI Chatbot Platform - ${clientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Welcome to the AI Chatbot Platform!</h2>
            <p>Hello,</p>
            <p>Your AI chatbot account for <strong>${clientName}</strong> has been created.</p>
            <p>You can access your dashboard and customize your AI assistant at any time.</p>
            <p>If you have any questions, please don't hesitate to contact our support team.</p>
            <div style="margin-top: 30px; padding: 15px; background-color: #f7f7f7; border-radius: 4px;">
              <p style="margin: 0; font-size: 14px; color: #666;">This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        `,
        from: "Welcome.Chat <admin@welcome.chat>"
      }
    });

    if (error) {
      console.error("Error sending invitation email:", error);
      throw error;
    }

    console.log("Invitation email sent successfully:", data);
  } catch (error) {
    console.error("Error in sendInvitationEmail:", error);
    throw error;
  }
};

// Log client update activity
export const logClientUpdateActivity = async (clientId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("client_activities")
      .insert({
        client_id: clientId,
        activity_type: "client_updated",
        description: "Client information updated",
        metadata: {
          updated_at: new Date().toISOString()
        }
      });

    if (error) {
      console.error("Error logging client update activity:", error);
      // We don't throw here as this is a non-critical operation
    }
  } catch (error) {
    console.error("Error in logClientUpdateActivity:", error);
    // We don't throw here as this is a non-critical operation
  }
};
