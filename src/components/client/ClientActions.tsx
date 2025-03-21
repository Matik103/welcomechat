
import { useState } from "react";
import { Eye, MessageSquare, Edit, Trash2, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { sendEmail } from "@/utils/emailUtils";
import { supabase } from "@/integrations/supabase/client";

interface ClientActionsProps {
  clientId: string;
  onDeleteClick: () => void;
}

export const ClientActions = ({ clientId, onDeleteClick }: ClientActionsProps) => {
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleSendInvitation = async () => {
    if (!clientId) {
      toast.error("Client ID is required to send invitation");
      return;
    }

    try {
      setIsSendingInvite(true);
      
      // First, fetch the client data from the clients table to get the email
      const { data: clientInfo, error: clientInfoError } = await supabase
        .from("clients")
        .select("email, client_name")
        .eq("id", clientId)
        .single();
      
      if (clientInfoError || !clientInfo) {
        console.error("Error fetching client info:", clientInfoError);
        toast.error("Failed to fetch client info for invitation");
        return;
      }
      
      // Then fetch the agent data to get the name and description
      const { data: agentData, error: agentError } = await supabase
        .from("ai_agents")
        .select("name, agent_description")
        .eq("client_id", clientId)
        .single();
      
      if (agentError) {
        console.error("Error fetching agent data:", agentError);
        toast.error("Failed to fetch agent data for invitation");
        return;
      }
      
      // Combine the data we need
      const combinedData = {
        email: clientInfo.email,
        client_name: clientInfo.client_name,
        name: agentData?.name || "AI Assistant",
        agent_description: agentData?.agent_description || ""
      };
      
      console.log("Fetched data for invitation:", combinedData);
      
      // Create a temporary password
      const { data: userData, error: userError } = await supabase.functions.invoke("create-client-user", {
        body: {
          email: combinedData.email,
          client_id: clientId,
          client_name: combinedData.client_name,
          agent_name: combinedData.name,
          agent_description: combinedData.agent_description,
        }
      });

      if (userError) {
        console.error("Error creating user account:", userError);
        toast.error("Failed to create user account for invitation");
        return;
      }
      
      if (!userData || !userData.temp_password) {
        console.error("No temporary password was generated", userData);
        toast.error("Failed to generate temporary password");
        return;
      }
      
      console.log("Generated temp password for invitation");
      
      // Send invitation email
      const emailResult = await sendEmail({
        to: combinedData.email,
        subject: "Welcome to Welcome.Chat - Your Account Details",
        template: "client-invitation",
        params: {
          clientName: combinedData.client_name,
          email: combinedData.email,
          tempPassword: userData.temp_password,
          productName: "Welcome.Chat"
        }
      });
      
      if (emailResult.success) {
        toast.success(`Invitation sent to ${combinedData.email}`);
      } else {
        console.error("Error sending invitation:", emailResult.message);
        toast.error(`Failed to send invitation: ${emailResult.message}`);
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send invitation");
    } finally {
      setIsSendingInvite(false);
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
        onClick={handleSendInvitation}
        className="p-1 text-gray-400 hover:text-green-600 transition-colors"
        title="Send Invitation"
        aria-label="Send client invitation"
        disabled={isSendingInvite}
      >
        <UserPlus className="w-4 h-4" />
      </button>
      <button
        onClick={onDeleteClick}
        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
        title="Schedule Deletion"
        aria-label="Schedule client deletion"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
};
