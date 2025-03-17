
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UrlCheckResult {
  isAccessible: boolean;
  hasScrapingRestrictions: boolean;
  statusCode?: number;
  contentType?: string;
  error?: string;
}

export function useUrlAccessCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<UrlCheckResult | null>(null);

  const checkUrlAccess = async (url: string): Promise<UrlCheckResult> => {
    setIsChecking(true);
    setLastResult(null);
    
    try {
      console.log("Checking URL access for:", url);
      const { data, error } = await supabase.functions.invoke("check-url-access", {
        body: { url },
      });
      
      if (error) {
        console.error("Error checking URL access:", error);
        const result = { 
          isAccessible: false, 
          hasScrapingRestrictions: true, 
          error: error.message 
        };
        setLastResult(result);
        return result;
      }
      
      console.log("URL access check result:", data);
      setLastResult(data);
      return data;
    } catch (error) {
      console.error("Error in URL access check:", error);
      const result = { 
        isAccessible: false, 
        hasScrapingRestrictions: true, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
      setLastResult(result);
      return result;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkUrlAccess,
    isChecking,
    lastResult
  };
}
