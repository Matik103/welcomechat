export const config = {
  // Processing settings
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
  processingTimeout: 300000, // 5 minutes
  
  // Rate limiting
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 30 // 30 requests per minute
  },
  
  // Document settings
  maxFileSizeMB: 50,
  supportedTypes: {
    pdf: ['application/pdf'],
    docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation']
  },
  
  // Error messages
  errors: {
    invalidToken: 'Invalid authentication token',
    missingParams: 'Missing required parameters',
    invalidFileType: 'Invalid or unsupported file type',
    fileTooLarge: 'File size exceeds maximum limit',
    downloadError: 'Failed to download file',
    processingError: 'Error processing document',
    rateLimitExceeded: 'Rate limit exceeded'
  }
};

// Validation functions
export const validators = {
  isValidDocumentType: (type: string): boolean => {
    return Object.keys(config.supportedTypes).includes(type);
  },
  
  isValidFileSize: (sizeInBytes: number): boolean => {
    return sizeInBytes <= config.maxFileSizeMB * 1024 * 1024;
  },
  
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}; 