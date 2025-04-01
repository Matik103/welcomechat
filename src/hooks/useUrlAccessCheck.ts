
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UrlCheckResult {
  canScrape: boolean;
  isAccessible: boolean;
  hasScrapingRestrictions?: boolean;
  statusCode?: number;
  contentType?: string;
  robotsRestrictions?: string[];
  metaRestrictions?: string[];
  content?: string;
  error?: string;
}

export function useUrlAccessCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<UrlCheckResult | null>(null);

  const checkUrl = async (url: string): Promise<UrlCheckResult> => {
    setIsChecking(true);
    setResult(null);

    try {
      // Call the check-url Edge Function
      const { data, error } = await supabase.functions.invoke('check-url', {
        body: { url }
      });

      if (error) {
        console.error('Error checking URL access:', error);
        const errorResult: UrlCheckResult = {
          canScrape: false,
          isAccessible: false,
          error: error.message || 'Failed to check URL accessibility'
        };
        setResult(errorResult);
        return errorResult;
      }

      // Process the response
      const urlResult: UrlCheckResult = {
        canScrape: data.canScrape || false,
        isAccessible: data.isAccessible || false,
        hasScrapingRestrictions: data.hasScrapingRestrictions,
        statusCode: data.statusCode,
        contentType: data.contentType,
        robotsRestrictions: data.robotsRestrictions,
        metaRestrictions: data.metaRestrictions,
        content: data.content,
        error: data.error
      };

      setResult(urlResult);
      return urlResult;
    } catch (error) {
      console.error('Error in useUrlAccessCheck:', error);
      const errorResult: UrlCheckResult = {
        canScrape: false,
        isAccessible: false,
        error: error instanceof Error ? error.message : 'Unknown error checking URL'
      };
      setResult(errorResult);
      return errorResult;
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkUrl,
    isChecking,
    result
  };
}
