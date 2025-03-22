
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
        if (type === 'website') {
          // Use the FirecrawlService validation for websites
          const validation = FirecrawlService.validateUrl(link);
          setIsValid(validation.isValid);
          setErrorMessage(validation.error || null);
        } 
        else if (type === 'google-drive') {
          // Basic validation for Google Drive links
          try {
            // Check if it's a valid URL format
            new URL(link);
            
            const isDriveLink = link.includes('drive.google.com') || 
                               link.includes('docs.google.com') ||
                               link.includes('sheets.google.com');
            
            if (!isDriveLink) {
              setIsValid(false);
              setErrorMessage('Link does not appear to be a Google Drive link.');
              setIsValidating(false);
              return;
            }
            
            // Basic format validation passed
            setIsValid(true);
            setErrorMessage(null);
          } catch (err) {
            setIsValid(false);
            setErrorMessage('Invalid URL format');
          }
        }
        else if (type === 'pdf') {
          try {
            // Check if it's a valid URL format
            new URL(link);
            
            const isPdfLink = link.toLowerCase().endsWith('.pdf');
            
            if (!isPdfLink) {
              setIsValid(false);
              setErrorMessage('URL does not appear to be a PDF link.');
              setIsValidating(false);
              return;
            }
            
            // Basic format validation passed
            setIsValid(true);
            setErrorMessage(null);
          } catch (err) {
            setIsValid(false);
            setErrorMessage('Invalid URL format');
          }
        }
        else {
          // Basic validation for other types
          try {
            // Just check if it's a valid URL
            new URL(link);
            setIsValid(true);
            setErrorMessage(null);
          } catch (err) {
            setIsValid(false);
            setErrorMessage('Invalid URL format');
          }
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
