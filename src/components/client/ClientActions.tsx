
import { Eye, MessageSquare, Edit, Trash2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateClientTempPassword } from "@/utils/passwordUtils";
import { sendEmail } from "@/utils/emailUtils";
import { Database } from "@/integrations/supabase/types";
import { createClientActivity } from "@/services/clientActivityService";

interface ClientActionsProps {
  clientId: string;
  onDeleteClick: () => void;
  invitationStatus?: "pending" | "sent";
}

export const ClientActions = ({ clientId, onDeleteClick, invitationStatus }: ClientActionsProps) => {
  const [isSending, setIsSending] = useState(false);

  const handleSendInvitation = async () => {
    if (!clientId) {
      toast.error("Client ID is missing");
      return;
    }

    try {
      setIsSending(true);
      const toastId = toast.loading("Sending invitation...");

      // First try to get data from ai_agents table since it's in our type definition
      const { data: agentData, error: agentError } = await supabase
        .from("ai_agents")
        .select("id, client_id, name, agent_description, settings, email, client_name, company")
        .eq("id", clientId)
        .single();
        
      if (agentError || !agentData) {
        console.error("Error fetching agent data:", agentError);
        throw new Error(agentError?.message || "Failed to fetch client details");
      }
      
      // Extract email and client name from agent data
      const email = agentData.email || '';
      const clientName = agentData.client_name || agentData.name || '';
      
      if (!email) {
        throw new Error("Client email not found in account information");
      }

      // Generate temporary password
      const tempPassword = generateClientTempPassword();
      
      // Store the temporary password
      const { error: tempPasswordError } = await supabase
        .from("client_temp_passwords")
        .insert({
          agent_id: clientId,
          email: email,
          temp_password: tempPassword
        });
        
      if (tempPasswordError) {
        throw new Error(`Failed to save temporary password: ${tempPasswordError.message}`);
      }
      
      // Send welcome email
      const emailResult = await sendEmail({
        to: email,
        subject: "Welcome to Welcome.Chat - Your Account Details",
        template: "client-invitation",
        params: {
          clientName: clientName || "Client",
          email: email,
          tempPassword: tempPassword,
          productName: "Welcome.Chat"
        }
      });
      
      if (!emailResult.success) {
        throw new Error(emailResult.error || "Failed to send invitation email");
      }
      
      // Prepare updated settings object
      let updatedSettings = {};
      
      // If settings exists and is an object, use it as base
      if (agentData.settings && typeof agentData.settings === 'object') {
        updatedSettings = { ...agentData.settings };
      }
      
      // Add invitation_status to settings
      updatedSettings = {
        ...updatedSettings,
        invitation_status: "sent"
      };

      // Update settings in the ai_agents table
      const { error: updateError } = await supabase
        .from("ai_agents")
        .update({ settings: updatedSettings })
        .eq("id", clientId);
        
      if (updateError) {
        throw new Error(`Failed to update invitation status: ${updateError.message}`);
      }

      // Log activity using the service function
      await createClientActivity(
        clientId,
        "email_sent", // Use a valid activity type from the enum
        "Invitation email sent to client",
        { email }
      );
      
      toast.dismiss(toastId);
      toast.success("Invitation sent successfully");
      
      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsSending(false);
    }
  };

  if (!clientId) {
    console.error("Missing client ID in ClientActions", clientId);
    toast.error("Missing client ID for actions");
    
    // Return disabled actions when clientId is missing
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="p-1 text-gray-300 cursor-not-allowed" title="View Client (ID missing)">
          <Eye className="w-4 h-4" />
        </span>
        <span className="p-1 text-gray-300 cursor-not-allowed" title="Widget Settings (ID missing)">
          <MessageSquare className="w-4 h-4" />
        </span>
        <span className="p-1 text-gray-300 cursor-not-allowed" title="Edit Info (ID missing)">
          <Edit className="w-4 h-4" />
        </span>
        <span className="p-1 text-gray-300 cursor-not-allowed" title="Delete (ID missing)">
          <Trash2 className="w-4 h-4" />
        </span>
      </div>
    );
  }

  console.log("Rendering client actions with ID:", clientId);

  return (
    <div className="flex items-center justify-end gap-2">
      <Link
        to={`/admin/clients/${clientId}`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="View Client"
      >
        <Eye className="w-4 h-4" />
      </Link>
      <Link
        to={`/admin/clients/${clientId}/widget-settings`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Widget Settings"
      >
        <MessageSquare className="w-4 h-4" />
      </Link>
      <Link
        to={`/admin/clients/${clientId}/edit-info`}
        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        title="Edit Info"
      >
        <Edit className="w-4 h-4" />
      </Link>
      <button
        onClick={onDeleteClick}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        title="Schedule Deletion"
        aria-label="Schedule client deletion"
      >
        <Trash2 className="w-4 h-4" />
      </button>
      {invitationStatus !== "sent" && (
        <button
          onClick={handleSendInvitation}
          disabled={isSending}
          className={`p-1 ${isSending ? "text-gray-300" : "text-gray-400 hover:text-blue-600"} transition-colors`}
          title="Send Invitation"
          aria-label="Send invitation email to client"
        >
          <Mail className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
