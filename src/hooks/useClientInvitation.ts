
import { useState } from "react";
import { sendClientInvitation } from "@/services/clientService";
import { toast } from "sonner";

export const useClientInvitation = () => {
  const [isSending, setIsSending] = useState(false);

  const sendInvitation = async (clientId: string, email: string, clientName: string) => {
    try {
      setIsSending(true);
      toast.info("Sending invitation email...");
      
      console.log("Starting invitation process for:", { clientId, email, clientName });
      
      await sendClientInvitation(clientId, email, clientName);
      
      console.log("Invitation sent successfully");
      toast.success("Invitation email sent to client");
      return true;
    } catch (error: any) {
      console.error("Invitation failed:", error);
      const errorMessage = error.message || "Failed to send invitation email";
      toast.error(`Error: ${errorMessage}`);
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
