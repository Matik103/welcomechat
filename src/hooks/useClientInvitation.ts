
import { useState } from "react";
import { toast } from "sonner";

export const useClientInvitation = () => {
  const [isSending, setIsSending] = useState(false);

  const sendInvitation = async (clientId: string, email: string, clientName: string) => {
    try {
      setIsSending(true);
      
      // Email sending functionality has been removed as requested
      console.log("Invitation email sending has been removed as requested");
      
      toast.success("Invitation functionality removed as requested");
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
