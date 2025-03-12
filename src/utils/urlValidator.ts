import { toast } from "sonner";

interface URLValidationResult {
  isValid: boolean;
  isAccessible: boolean;
  isGoogleDrive: boolean;
  message: string;
}

export const validateURL = async (url: string): Promise<URLValidationResult> => {
  try {
    // Basic URL validation
    const urlObj = new URL(url);
    
    // Check if it's a Google Drive URL
    const isGoogleDrive = urlObj.hostname.includes('drive.google.com');
    
    // For Google Drive URLs, we need to check if it's publicly accessible
    if (isGoogleDrive) {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'cors',
      });
      
      if (response.status === 200) {
        return {
          isValid: true,
          isAccessible: true,
          isGoogleDrive: true,
          message: 'Google Drive link is accessible'
        };
      } else {
        return {
          isValid: true,
          isAccessible: false,
          isGoogleDrive: true,
          message: 'This Google Drive link appears to be private. Please make sure to set the sharing settings to "Anyone with the link"'
        };
      }
    }
    
    // For regular URLs, check if they can be crawled
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'cors',
    });
    
    // Check robots.txt
    const robotsResponse = await fetch(`${urlObj.origin}/robots.txt`);
    const robotsText = await robotsResponse.text();
    const hasScrapingRestrictions = robotsText.toLowerCase().includes('disallow: /');
    
    if (response.status === 200) {
      if (hasScrapingRestrictions) {
        return {
          isValid: true,
          isAccessible: false,
          isGoogleDrive: false,
          message: 'This website has scraping restrictions. Some content might not be accessible for our system.'
        };
      }
      return {
        isValid: true,
        isAccessible: true,
        isGoogleDrive: false,
        message: 'URL is valid and accessible'
      };
    } else {
      return {
        isValid: true,
        isAccessible: false,
        isGoogleDrive: false,
        message: 'This URL is not accessible. Please check if the link is correct and publicly available.'
      };
    }
  } catch (error) {
    return {
      isValid: false,
      isAccessible: false,
      isGoogleDrive: false,
      message: 'Invalid URL format. Please enter a valid URL.'
    };
  }
};

export const validateAndNotify = async (url: string): Promise<boolean> => {
  const result = await validateURL(url);
  
  if (!result.isValid) {
    toast.error(result.message);
    return false;
  }
  
  if (!result.isAccessible) {
    toast.warning(result.message);
    return false;
  }
  
  if (result.isGoogleDrive) {
    toast.success('Google Drive link validated successfully');
  } else {
    toast.success('URL validated successfully');
  }
  
  return true;
}; 