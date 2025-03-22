
import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { FirecrawlService } from '@/utils/FirecrawlService';

interface ValidationResultProps {
  link: string;
  type: 'website' | 'google-drive' | 'pdf' | 'text';
}

export const ValidationResult = ({ link, type }: ValidationResultProps) => {
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const validateLink = async () => {
      // Reset validation state
      setIsValid(null);
      setErrorMessage(null);
      
      // Check if there's a link to validate
      if (!link || link.trim() === '') return;
      
      setIsValidating(true);
      
      try {
        // For all types, first check if it's a valid URL format
        try {
          new URL(link);
          
          // Simple type-specific checks
          if (type === 'website') {
            // Use the FirecrawlService validation for websites
            const validation = FirecrawlService.validateUrl(link);
            setIsValid(validation.isValid);
            setErrorMessage(validation.error || null);
          } 
          else if (type === 'google-drive') {
            // Relaxed validation for Google Drive links - just check if it contains any Google domain
            const isGoogleLink = link.includes('google.com');
            
            if (!isGoogleLink) {
              setIsValid(false);
              setErrorMessage('URL does not appear to be a Google link');
            } else {
              setIsValid(true);
            }
          }
          else if (type === 'pdf') {
            // For PDFs, either ends with .pdf or contains PDF in the path (for Google Drive PDFs)
            const isPdfLink = link.toLowerCase().endsWith('.pdf') || 
                             link.toLowerCase().includes('/pdf') || 
                             link.toLowerCase().includes('pdf/') ||
                             link.toLowerCase().includes('pdf=');
            
            if (!isPdfLink) {
              // Not strictly a PDF link but still valid URL
              setIsValid(true);
              setErrorMessage('URL does not appear to be a PDF link, but will be accepted');
            } else {
              setIsValid(true);
            }
          }
          else {
            // For all other types, just accept any valid URL
            setIsValid(true);
          }
        } catch (err) {
          setIsValid(false);
          setErrorMessage('Invalid URL format');
        }
      } catch (err) {
        console.error('Error validating link:', err);
        setIsValid(false);
        setErrorMessage('Error validating link.');
      } finally {
        setIsValidating(false);
      }
    };

    // Add a delay to avoid validating while user is typing
    const timer = setTimeout(() => {
      if (link && link.trim() !== '') {
        validateLink();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [link, type]);

  if (!link || link.trim() === '') return null;
  
  if (isValidating) {
    return (
      <div className="flex items-center text-gray-500 mt-1">
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
        <span className="text-xs">Validating link...</span>
      </div>
    );
  }
  
  if (isValid === true) {
    return (
      <div className="flex items-center text-green-600 mt-1">
        <CheckCircle className="h-4 w-4 mr-1" />
        <span className="text-xs">Valid link format</span>
      </div>
    );
  }
  
  if (isValid === false) {
    return (
      <div className="flex items-center text-red-500 mt-1">
        <AlertCircle className="h-4 w-4 mr-1" />
        <span className="text-xs">{errorMessage || 'Invalid link'}</span>
      </div>
    );
  }
  
  return null;
};
