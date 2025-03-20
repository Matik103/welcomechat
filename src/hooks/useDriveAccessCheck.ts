
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccessStatus } from "@/types/client";

export const useDriveAccessCheck = (linkId: number) => {
  const { data: accessStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["driveAccess", linkId],
    queryFn: async (): Promise<AccessStatus> => {
      try {
        // Get document_links table separately - do not reference it directly
        const res = await supabase.rpc('get_document_access_status', {
          document_id: linkId
        });
        
        if (res.error) {
          console.error("Error checking drive access:", res.error);
          return "unknown";
        }
        
        if (res.data && typeof res.data === 'string') {
          return res.data as AccessStatus;
        }
        
        return "unknown";
      } catch (error) {
        console.error("Error checking drive access:", error);
        return "unknown";
      }
    },
    enabled: !!linkId,
  });

  return {
    accessStatus: accessStatus || "unknown",
    isLoading,
    error,
    refreshStatus: refetch
  };
};
