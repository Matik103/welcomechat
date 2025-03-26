
// Add document_id to the record creation:
export async function registerDocumentProcessing(
  clientId: string,
  documentUrl: string,
  documentType: string,
  agentName: string
): Promise<{ id: string }> {
  try {
    const { data, error } = await supabase
      .from('document_processing')
      .insert({
        client_id: clientId,
        document_url: documentUrl,
        document_type: documentType,
        agent_name: agentName,
        status: 'pending',
        document_id: crypto.randomUUID() // Generate a unique document_id
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error registering document processing:', error);
      throw error;
    }

    return { id: data?.id || '' };
  } catch (error) {
    console.error('Error in registerDocumentProcessing:', error);
    throw error;
  }
}

// Fix the getProcessingStats function to handle type safety:
export async function getProcessingStats(clientId: string) {
  try {
    const { data, error } = await supabase
      .rpc('get_document_processing_stats', { client_id_param: clientId });

    if (error) throw error;

    if (!data) return { processed: 0, failed: 0 };

    // Type guard to check if data is an object with the right properties
    if (typeof data === 'object' && data !== null) {
      const jsonObject = data as Record<string, any>;
      return {
        processed: jsonObject.processed_count || 0,
        failed: jsonObject.failed_count || 0
      };
    }

    return { processed: 0, failed: 0 };
  } catch (error) {
    console.error('Error getting processing stats:', error);
    return { processed: 0, failed: 0 };
  }
}

// Fix the logDocumentActivity function:
export async function logDocumentActivity(
  clientId: string,
  documentUrl: string,
  status: 'added' | 'processed' | 'failed',
  metadata: any = {}
) {
  try {
    // Use a proper ActivityType here
    const activityType: ActivityType = status === 'added' 
      ? 'document_added' 
      : status === 'processed' 
        ? 'document_processed' 
        : 'document_processing_failed';

    await createClientActivity(
      clientId,
      activityType,
      `Document ${status}: ${new URL(documentUrl).pathname.split('/').pop()}`,
      metadata
    );
  } catch (error) {
    console.error(`Error logging document ${status} activity:`, error);
  }
}
