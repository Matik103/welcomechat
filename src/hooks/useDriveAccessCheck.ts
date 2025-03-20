
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccessStatus } from "@/integrations/supabase/types";
import { execSql } from "@/utils/rpcUtils";

export const useDriveAccessCheck = (linkId: number) => {
  const { data: accessStatus, isLoading, error, refetch } = useQuery({
    queryKey: ["driveAccess", linkId],
    queryFn: async (): Promise<AccessStatus> => {
      try {
        // First try to use the dedicated RPC function
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_document_access_status', {
            document_id: linkId
          });
          
          if (!rpcError && rpcData) {
            return rpcData as AccessStatus;
          }
        } catch (rpcError) {
          console.log("RPC method not available, falling back to SQL", rpcError);
        }
        
        // Fall back to using execSql
        const sql = `
          SELECT access_status FROM document_links
          WHERE id = $1
        `;
        
        const res = await execSql(sql, { id: linkId });
        
        if (Array.isArray(res) && res.length > 0) {
          return (res[0].access_status || 'unknown') as AccessStatus;
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
