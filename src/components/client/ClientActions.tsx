
import { Eye, MessageSquare, Edit, Trash2, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateClientTempPassword } from "@/utils/passwordUtils";
import { sendEmail } from "@/utils/emailUtils";

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
      toast.loading("Sending invitation...");

      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from("ai_agents")
        .select("id, client_name, email, settings")
        .eq("id", clientId)
        .single();

      if (clientError || !clientData) {
        throw new Error(clientError?.message || "Failed to fetch client details");
      }

      // Extract client information - handle the settings object more carefully
      let email: string | undefined = clientData.email;
      let clientName: string | undefined = clientData.client_name;
      
      // Check if settings exists and is an object before accessing properties
      if (clientData.settings && typeof clientData.settings === 'object' && !Array.isArray(clientData.settings)) {
        // Now TypeScript knows settings is an object, we can safely access properties
        email = email || (clientData.settings as Record<string, any>).email;
        clientName = clientName || (clientData.settings as Record<string, any>).client_name;
      }
      
      if (!email) {
        throw new Error("Client email not found");
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
        throw new Error("Failed to save temporary password");
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
      
      // Update invitation status
      const { error: updateError } = await supabase
        .from("ai_agents")
        .update({ 
          settings: JSON.stringify({
            ...(clientData.settings as object || {}),
            invitation_status: "sent"
          }),
          invitation_status: "sent"  // Add this field directly
        })
        .eq("id", clientId);
        
      if (updateError) {
        throw new Error("Failed to update invitation status");
      }

      // Log activity
      await supabase
        .from("client_activities")
        .insert({
          client_id: clientId,
          activity_type: "system_update",
          description: "Invitation email sent to client",
          metadata: { email }
        });
      
      toast.dismiss();
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
        to={`/admin/clients/view/${clientId}`}
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
