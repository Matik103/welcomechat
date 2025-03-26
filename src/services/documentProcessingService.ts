
// Just adding a fix for the error on line 635
export const checkDocumentAccess = async (documentId: number | string): Promise<string> => {
  try {
    // Convert string to number if necessary
    const docId = typeof documentId === 'string' ? parseInt(documentId, 10) : documentId;
    
    const result = await callRpcFunction<string>('get_document_access_status', {
      document_id: docId
    });
    return result || 'unknown';
  } catch (error) {
    console.error('Error checking document access:', error);
    return 'unknown';
  }
};
