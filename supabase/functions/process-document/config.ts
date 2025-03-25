
// Configuration for document processing edge function

export const config = {
  errors: {
    missingParams: 'Missing required parameters. Please provide documentUrl, documentType, clientId, and agentName.',
    invalidDocType: 'Invalid document type. Supported types include PDF, Word, Excel, PowerPoint, and text files.',
    invalidToken: 'Invalid authorization token.',
    processingFailed: 'Document processing failed. Please try again later.',
  },
  successMessages: {
    docProcessed: 'Document processed successfully.',
    jobCreated: 'Document processing job created successfully.',
  }
};

// Validate if a URL is properly formatted
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Validate if a document type is supported
export const isValidDocumentType = (type: string): boolean => {
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'website_url',
    'google_doc',
    'google_sheet',
    'google_drive',
    'pdf',
    'text',
    'other'
  ];
  
  // Check exact match
  if (validTypes.includes(type)) {
    return true;
  }
  
  // Check if type contains any of the valid format strings
  return validTypes.some(validType => 
    type.includes(validType.replace('application/', '')) ||
    type.includes(validType.replace('text/', ''))
  );
};
