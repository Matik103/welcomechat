
import { useState } from "react";
import { sendClientInvitation } from "@/services/clientService";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const useClientInvitation = () => {
  const [isSending, setIsSending] = useState(false);

  const sendInvitation = async (clientId: string, email: string, clientName: string) => {
    try {
      setIsSending(true);
      toast.info("Sending invitation email...");
      
      // First try the custom invitation method
      try {
        await sendClientInvitation(clientId, email, clientName);
        toast.success("Invitation email sent to client");
        return true;
      } catch (customInviteError) {
        console.warn("Custom invitation failed, falling back to Supabase's built-in method:", customInviteError);
        
        // Fall back to Supabase's built-in email confirmation
        const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
          data: {
            client_id: clientId,
            client_name: clientName
          },
          redirectTo: `https://admin.welcome.chat/client/setup?id=${clientId}`
        });
        
        if (error) {
          console.error("Both invitation methods failed:", error);
          toast.error(`Error: ${error.message || "Failed to send invitation email"}`);
          throw error;
        }
        
        toast.success("Confirmation email sent to client via Supabase");
        return true;
      }
    } catch (error) {
      console.error("All invitation methods failed:", error);
      toast.error(`Error: ${error.message || "Failed to send invitation email"}`);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendInvitation,
    isSending
  };
};
