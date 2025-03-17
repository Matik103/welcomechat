
import { useMutation } from "@tanstack/react-query";
import { ClientFormData } from "@/types/client";
import { 
  updateClient, 
  createClient,
  logClientUpdateActivity,
  sendClientInvitationEmail
} from "@/services/client";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Utility function to handle auth errors
 */
const handleAuthError = async (error: any) => {
  // Check if this is an expired JWT error
  if (error?.code === 'PGRST301' || 
      error?.message?.includes('JWT expired') || 
      error?.message?.includes('JWT') || 
      error?.message?.includes('auth')) {
    
    toast.warning("Your session has expired. Attempting to refresh...");
    
    try {
      // Try to refresh the session
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error("Error refreshing session:", refreshError);
        toast.error("Authentication error. Please sign in again.");
        
        // Redirect to login page after a short delay
        setTimeout(() => {
          window.location.href = '/auth';
        }, 2000);
        
        return false;
      }
      
      if (data.session) {
        toast.success("Session refreshed successfully");
        return true; // Indicate successful refresh
      }
    } catch (refreshErr) {
      console.error("Error during session refresh:", refreshErr);
      toast.error("Authentication error. Please sign in again.");
      
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    }
  }
  
  return false; // Not an auth error or refresh failed
};

export const useClientMutation = (id: string | undefined) => {
  const clientMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      // Sanitize agent name to ensure it's valid
      const sanitizedAgentName = data.agent_name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_');
      
      const finalAgentName = sanitizedAgentName || 'agent_' + Date.now();
      
      const updatedData = {
        ...data,
        agent_name: finalAgentName,
      };

      try {
        if (id) {
          // Update existing client
          const clientId = await updateClient(id, updatedData);
          await logClientUpdateActivity(id);
          return clientId;
        } else {
          // Create new client
          let clientId;
          let emailSent = false;
          let errorMessage = null;
          
          // Step 1: Create the client record first
          clientId = await createClient(updatedData);
          
          // Step 2: Try to send the invitation email
          try {
            await sendClientInvitationEmail({
              clientId: clientId,
              clientName: data.client_name,
              email: data.email,
              agentName: finalAgentName
            });
            
            emailSent = true;
          } catch (emailError: any) {
            console.error("Failed to send invitation email:", emailError);
            errorMessage = emailError.message;
            // Continue with client creation even if email fails
          }
          
          return {
            clientId,
            emailSent,
            errorMessage
          };
        }
      } catch (error: any) {
        console.error("Error in client creation process:", error);
        
        // Check if this is an auth error that we can potentially recover from
        const wasRefreshed = await handleAuthError(error);
        
        if (wasRefreshed) {
          toast.loading("Retrying operation after session refresh...");
          
          // Retry the operation after session refresh
          if (id) {
            const clientId = await updateClient(id, updatedData);
            await logClientUpdateActivity(id);
            return clientId;
          } else {
            const clientId = await createClient(updatedData);
            let emailSent = false;
            let errorMessage = null;
            
            try {
              await sendClientInvitationEmail({
                clientId,
                clientName: data.client_name,
                email: data.email,
                agentName: finalAgentName
              });
              emailSent = true;
            } catch (emailError: any) {
              errorMessage = emailError.message;
            }
            
            return { clientId, emailSent, errorMessage };
          }
        }
        
        // If we couldn't recover or it's not an auth error, rethrow
        throw error;
      }
    },
    
    // Add retry logic and error handling
    retry: (failureCount, error: any) => {
      // Only retry a limited number of times
      if (failureCount > 2) return false;
      
      // Check if this is a network error or other transient issue
      const isNetworkError = error?.message?.includes('network') || 
                             error?.message?.includes('internet') || 
                             error?.message?.includes('failed to fetch');
      
      return isNetworkError;
    }
  });

  return clientMutation;
};
