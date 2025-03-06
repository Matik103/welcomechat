
import { useState } from "react";
import { sendClientInvitation } from "@/services/clientService";
import { toast } from "sonner";

export const useClientInvitation = () => {
  const [isSending, setIsSending] = useState(false);

  const sendInvitation = async (clientId: string, email: string, clientName: string) => {
    try {
      setIsSending(true);
      toast.info("Sending setup email...");
      
      await sendClientInvitation(clientId, email, clientName);
      toast.success("Setup email sent to client");
      return true;
    } catch (error) {
      console.error("Invitation method failed:", error);
      toast.error(`Error: ${error.message || "Failed to send setup email"}`);
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
