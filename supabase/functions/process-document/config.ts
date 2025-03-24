export const config = {
  processing: {
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    processingTimeout: 300000, // 5 minutes
  },
  rateLimit: {
    windowMs: 60000, // 1 minute
    maxRequests: 10, // 10 requests per minute
  },
  document: {
    maxFileSizeMB: 50,
    supportedTypes: ['pdf', 'docx', 'xlsx', 'pptx'],
  },
  errors: {
    invalidToken: 'Invalid or missing authorization token',
    missingParams: 'Missing required parameters',
    invalidDocType: 'Invalid document type',
    fileSizeLimit: 'File size exceeds the maximum limit',
    invalidUrl: 'Invalid document URL',
    processingFailed: 'Document processing failed',
    rateLimitExceeded: 'Rate limit exceeded',
  },
};

export const isValidDocumentType = (type: string): boolean => {
  return config.document.supportedTypes.includes(type.toLowerCase());
};

export const isValidFileSize = (sizeInBytes: number): boolean => {
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= config.document.maxFileSizeMB;
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}; 