
import { supabase } from "@/integrations/supabase/client";

export const useClientActivityLogger = () => {
  const logClientLoginActivity = async (clientId: string) => {
    try {
      await supabase.from("client_activities").insert({
        client_id: clientId,
        activity_type: "client_login" as any,
        description: "logged into their account",
        metadata: { timestamp: new Date().toISOString() }
      });
    } catch (error) {
      console.error("Failed to log login activity:", error);
    }
  };
  
  return { logClientLoginActivity };
};
