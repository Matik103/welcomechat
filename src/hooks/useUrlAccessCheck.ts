
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UrlCheckResult {
  isAccessible: boolean;
  hasScrapingRestrictions: boolean;
  canScrape?: boolean;
  statusCode?: number;
  contentType?: string;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
  content?: string;
  error?: string;
}

export interface UrlAccessResult {
  isAccessible: boolean;
  status?: number;
  canScrape: boolean;
  hasScrapingRestrictions: boolean;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
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
        
        // If the Edge Function fails, use FirecrawlService.validateUrl
        try {
          const { isValid, error } = await validateUrlWithFirecrawl(url);
          
          const fallbackResult: UrlCheckResult = {
            isAccessible: isValid,
            hasScrapingRestrictions: false,
            canScrape: isValid,
            error: error
          };
          
          console.log("Using fallback validation result:", fallbackResult);
          setLastResult(fallbackResult);
          return fallbackResult;
        } catch (validationError) {
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
  
  // Helper function to validate URL using Firecrawl
  const validateUrlWithFirecrawl = async (url: string): Promise<{ isValid: boolean; error?: string }> => {
    try {
      // Try to create a URL object to validate the format
      new URL(url);
      
      // Try a simple HEAD request to check if the URL is accessible
      const response = await fetch(url, { 
        method: 'HEAD',
        // Use a reasonable timeout
        signal: AbortSignal.timeout(5000)
      });
      
      if (response.ok) {
        return { isValid: true };
      } else {
        return { 
          isValid: false, 
          error: `URL returned status code ${response.status}` 
        };
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return { 
          isValid: false, 
          error: 'Unable to access URL. It may be down or blocking requests.' 
        };
      }
      
      return { 
        isValid: false, 
        error: error instanceof Error ? error.message : 'Unknown error validating URL' 
      };
    }
  };

  return {
    checkUrlAccess,
    isChecking,
    lastResult
  };
}
