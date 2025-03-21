
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { sendClientInvitation } from "@/utils/clientInvitationUtils";
import { supabase } from "@/integrations/supabase/client";

interface ClientActionsProps {
  clientId: string;
  onDeleteClick: () => void;
  invitationSent?: boolean;
}

export const ClientActions = ({ 
  clientId, 
  onDeleteClick,
  invitationSent = false
}: ClientActionsProps) => {
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);
  
  const handleSendInvitation = async () => {
    try {
      setIsSendingInvitation(true);
      
      // First, get the client details
      const { data: clientData, error: clientError } = await supabase
        .from("ai_agents")
        .select("client_name, email")
        .eq("id", clientId)
        .single();
      
      if (clientError || !clientData) {
        console.error("Error fetching client details:", clientError);
        toast.error("Failed to fetch client details");
        return;
      }
      
      // Now send the invitation
      toast.loading(`Sending invitation to ${clientData.email}...`);
      
      const result = await sendClientInvitation(
        clientId, 
        clientData.client_name,
        clientData.email
      );
      
      if (result.success) {
        toast.success(`Invitation sent successfully to ${clientData.email}`);
        // Force a page refresh to update the invitation status
        window.location.reload();
      } else {
        toast.error(`Failed to send invitation: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsSendingInvitation(false);
    }
  };
  
  return (
    <div className="flex justify-end gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <Link to={`/admin/clients/edit/${clientId}`}>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          </Link>
          
          {!invitationSent && (
            <DropdownMenuItem 
              onClick={handleSendInvitation}
              disabled={isSendingInvitation}
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Invitation
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem 
            className="text-red-600 focus:text-red-600" 
            onClick={onDeleteClick}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
