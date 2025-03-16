
// This file is kept for backward compatibility but its functionality has been removed
import { useState } from "react";
import { toast } from "sonner";

export const useClientInvitation = () => {
  const [isSending, setIsSending] = useState(false);

  const sendInvitation = async (clientId: string, email: string, clientName: string) => {
    toast.error("Invitation functionality has been removed");
    return false;
  };

  return {
    sendInvitation,
    isSending
  };
};
