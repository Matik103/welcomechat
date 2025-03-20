
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AccessStatus } from "@/types/document-processing";
import { toast } from "@/components/ui/use-toast";
import { callRpcFunction } from "@/utils/rpcUtils";

export const useDriveAccessCheck = () => {
  const [validationResult, setValidationResult] = useState<AccessStatus>("unknown");
  const [isValidating, setIsValidating] = useState(false);

  // Added properties to fix DocumentLinkForm and similar components
  const accessStatus = validationResult;
  const isLoading = isValidating;

  const validateDriveLink = useCallback(async (link: string): Promise<AccessStatus> => {
    if (!link) return "unknown";
    
    setIsValidating(true);
    setValidationResult("unknown");
    
    try {
      // Call the Supabase function to check drive access
      const { data, error } = await supabase.functions.invoke("check-drive-access", {
        body: { link },
      });
      
      if (error) {
        console.error("Error checking drive access:", error);
        setValidationResult("inaccessible");
        toast({
          title: "Error",
          description: "Unable to validate Google Drive link",
          variant: "destructive",
        });
        return "inaccessible";
      }
      
      const accessStatus = data?.accessible === true ? "accessible" : "inaccessible";
      setValidationResult(accessStatus);
      
      if (accessStatus === "inaccessible") {
        toast({
          title: "Warning",
          description: "This Google Drive link may not be accessible",
          variant: "destructive",
        });
      }
      
      return accessStatus;
    } catch (error) {
      console.error("Error in validateDriveLink:", error);
      setValidationResult("inaccessible");
      toast({
        title: "Error",
        description: "Unable to validate Google Drive link",
        variant: "destructive",
      });
      return "inaccessible";
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Add refreshStatus method to fix DocumentLinkForm
  const refreshStatus = useCallback(async (): Promise<void> => {
    setValidationResult("unknown");
  }, []);

  return { 
    validateDriveLink, 
    isValidating, 
    validationResult,
    // Added properties to fix errors
    accessStatus,
    refreshStatus,
    isLoading,
    error: null
  };
};
