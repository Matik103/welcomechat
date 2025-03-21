
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// Interface for URL access check result
export interface UrlCheckResult {
  isAccessible: boolean;
  hasScrapingRestrictions: boolean;
  statusCode?: number;
  contentType?: string;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
  canScrape: boolean; // Made required (not optional)
  content?: string;
  error?: string;
}

// Alias for backward compatibility
export type UrlAccessResult = UrlCheckResult;

export const useUrlAccessCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [lastResult, setLastResult] = useState<UrlCheckResult | null>(null);

  const checkUrlAccess = async (url: string): Promise<UrlCheckResult> => {
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.functions.invoke<UrlCheckResult>(
        'check-url-access',
        {
          body: { url }
        }
      );
      
      if (error) {
        console.error("Error checking URL access:", error);
        const errorResult: UrlCheckResult = {
          isAccessible: false,
          hasScrapingRestrictions: true,
          canScrape: false, // Always include this property
          error: error.message
        };
        setLastResult(errorResult);
        return errorResult;
      }
      
      // Ensure canScrape is always defined if missing from response
      const result: UrlCheckResult = {
        ...data,
        canScrape: data?.canScrape ?? !data?.hasScrapingRestrictions
      };
      
      setLastResult(result);
      return result;
    } catch (err) {
      console.error("Exception checking URL access:", err);
      const errorResult: UrlCheckResult = {
        isAccessible: false,
        hasScrapingRestrictions: true,
        canScrape: false, // Always include this property
        error: err instanceof Error ? err.message : 'Unknown error checking URL'
      };
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkUrlAccess,
    isChecking,
    lastResult
  };
};
