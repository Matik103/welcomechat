
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccessStatus } from "@/types/client";

export const useDriveAccessCheck = (linkId: number) => {
  const { data: accessStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["driveAccess", linkId],
    queryFn: async (): Promise<AccessStatus> => {
      try {
        const { data, error } = await supabase
          .from("google_drive_links")
          .select("access_status")
          .eq("id", linkId)
          .single();

        if (error) throw error;
        
        return (data?.access_status as AccessStatus) || "unknown";
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
