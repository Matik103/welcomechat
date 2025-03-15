
import { useState } from "react";
import { sendClientInvitation } from "@/services/clientService";
import { toast } from "sonner";

export const useClientInvitation = () => {
  const [isSending, setIsSending] = useState(false);

  const sendInvitation = async (clientId: string, email: string, clientName: string) => {
    try {
      setIsSending(true);
      toast.info("Sending invitation email...");
      
      console.log("Sending invitation for client:", { clientId, email, clientName });
      
      const result = await sendClientInvitation(clientId, email, clientName);
      console.log("Invitation result:", result);
      
      toast.success("Invitation email sent to client");
      return true;
    } catch (error: any) {
      console.error("Invitation failed:", error);
      toast.error(`Error: ${error.message || "Failed to send invitation email"}`);
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return {
    sendInvitation,
    isSending
  };
};
