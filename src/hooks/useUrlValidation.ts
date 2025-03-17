import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ValidationDetails {
  statusCode?: number;
  contentType?: string;
  robotsTxtAllows?: boolean;
  isGoogleDriveViewable?: boolean;
  isSecure?: boolean;
  serverInfo?: {
    headers?: Record<string, string>;
    certificate?: {
      valid: boolean;
      expiryDate?: string;
    };
  };
}

interface ValidationResult {
  isAccessible: boolean;
  error?: string;
  details?: ValidationDetails;
}

export function useUrlValidation() {
  const [isValidating, setIsValidating] = useState(false);

  const validateUrl = async (url: string, type: 'website' | 'drive'): Promise<ValidationResult> => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-urls', {
        body: { url, type }
      });

      if (error) {
        console.error('URL validation error:', error);
        return {
          isAccessible: false,
          error: error.message || 'Failed to validate URL'
        };
      }

      // Add warnings based on validation details
      const result = data as ValidationResult;
      
      if (result.isAccessible && result.details) {
        const warnings: string[] = [];
        
        if (type === 'website') {
          if (!result.details.isSecure) {
            warnings.push('This website does not use HTTPS. It may not be secure.');
          }
          
          if (result.details.robotsTxtAllows === false) {
            warnings.push('This website blocks web scraping. Content may not be accessible to the AI.');
          }

          const contentType = result.details.contentType?.toLowerCase() || '';
          if (!contentType.includes('text/html') && 
              !contentType.includes('application/json') && 
              !contentType.includes('text/plain')) {
            warnings.push(`Unsupported content type: ${result.details.contentType}`);
          }
        }

        if (type === 'drive' && !result.details.isGoogleDriveViewable) {
          warnings.push('This Google Drive link may have restricted access.');
        }

        if (warnings.length > 0) {
          result.error = warnings.join('\n');
        }
      }

      return result;
    } catch (error) {
      console.error('URL validation error:', error);
      return {
        isAccessible: false,
        error: error instanceof Error ? error.message : 'Failed to validate URL'
      };
    } finally {
      setIsValidating(false);
    }
  };

  return {
    validateUrl,
    isValidating
  };
} 