
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UrlCheckResult {
  isAccessible: boolean;
  hasScrapingRestrictions: boolean;
  canScrape?: boolean;
  statusCode?: number;
  contentType?: string;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
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
      
      // Try using the Supabase Edge Function
      try {
        const { data, error } = await supabase.functions.invoke("check-url-access", {
          body: { url },
        });
        
        if (error) {
          console.error("Error checking URL access:", error);
          throw error;
        }
        
        console.log("URL access check result:", data);
        setLastResult(data);
        return data;
      } catch (edgeFunctionError) {
        console.error("Edge function error:", edgeFunctionError);
        
        // If the Edge Function fails, fall back to a basic client-side check
        console.log("Falling back to basic URL validation...");
        
        // Validate the URL format
        try {
          new URL(url);
          
          // Since we can't actually check access without the server,
          // we'll assume it's accessible but with unknown scraping status
          const fallbackResult: UrlCheckResult = {
            isAccessible: true,
            hasScrapingRestrictions: false,
            canScrape: true,
            statusCode: 200,
            error: "URL format is valid, but full accessibility check failed. The URL was added without complete validation."
          };
          
          console.log("Using fallback result:", fallbackResult);
          setLastResult(fallbackResult);
          return fallbackResult;
        } catch (urlError) {
          const invalidUrlResult: UrlCheckResult = {
            isAccessible: false,
            hasScrapingRestrictions: true,
            canScrape: false,
            error: "Invalid URL format"
          };
          setLastResult(invalidUrlResult);
          return invalidUrlResult;
        }
      }
    } catch (error) {
      console.error("Error in URL access check:", error);
      const result = { 
        isAccessible: false, 
        hasScrapingRestrictions: true,
        canScrape: false,
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
