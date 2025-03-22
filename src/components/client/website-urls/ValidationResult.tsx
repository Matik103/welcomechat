
import React from 'react';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';
import { UrlCheckResult } from '@/hooks/useUrlAccessCheck';

interface ValidationResultProps {
  error: string | null;
  isValidated: boolean;
  lastResult: UrlCheckResult;
}

export const ValidationResult = ({ error, isValidated, lastResult }: ValidationResultProps) => {
  if (!isValidated) return null;
  
  if (error) {
    return (
      <div className="flex items-center text-red-500 text-sm mt-2">
        <AlertCircle className="h-4 w-4 mr-2" />
        <span>{error}</span>
      </div>
    );
  }
  
  if (lastResult.isAccessible) {
    if (lastResult.hasScrapingRestrictions) {
      return (
        <div className="flex items-center text-amber-500 text-sm mt-2">
          <Info className="h-4 w-4 mr-2" />
          <span>
            Website is accessible but may have some scraping restrictions.
            {lastResult.robotsRestrictions && lastResult.robotsRestrictions.length > 0 && (
              <span className="block text-xs mt-1">
                Restrictions in robots.txt detected.
              </span>
            )}
            {lastResult.metaRestrictions && lastResult.metaRestrictions.length > 0 && (
              <span className="block text-xs mt-1">
                Meta tag restrictions detected.
              </span>
            )}
          </span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center text-green-500 text-sm mt-2">
        <CheckCircle className="h-4 w-4 mr-2" />
        <span>Website is accessible and can be crawled.</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center text-red-500 text-sm mt-2">
      <AlertCircle className="h-4 w-4 mr-2" />
      <span>Website is not accessible. Please check the URL and try again.</span>
    </div>
  );
};
