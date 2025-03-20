
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccessStatus } from "@/types/client";
import { execSql } from "@/utils/rpcUtils";

export const useDriveAccessCheck = (linkId: number) => {
  const { data: accessStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["driveAccess", linkId],
    queryFn: async (): Promise<AccessStatus> => {
      try {
        // Use execSql to query the document_links table for access status
        const sql = `
          SELECT access_status FROM document_links
          WHERE id = $1
        `;
        
        const res = await execSql(sql, { id: linkId });
        
        if (Array.isArray(res) && res.length > 0 && res[0].access_status) {
          return res[0].access_status as AccessStatus;
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
