
import React, { useEffect } from 'react';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { supabase } from '@/integrations/supabase/client';

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

interface ClientResourceSectionsProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: (action: string, details: Record<string, any>) => Promise<void>;
}

export const ClientResourceSections = ({
  clientId,
  onResourceChange,
  logClientActivity
}: ClientResourceSectionsProps) => {
  const { uploadDocument, isUploading } = useDocumentUpload(clientId);

  // Debug client ID with less frequent logging
  useEffect(() => {
    console.log("ClientResourceSections rendered with clientId:", clientId);
    
    // Check if agent configuration exists, create if not
    const ensureAgentConfig = async () => {
      try {
        // Check if config exists
        const { data, error } = await supabase
          .from('ai_agents')
          .select('id')
          .eq('client_id', clientId)
          .eq('interaction_type', 'config')
          .limit(1);
        
        if (error) {
          console.error("Error checking agent config:", error);
          return;
        }
        
        if (!data || data.length === 0) {
          console.log("No agent config found, creating default config");
          
          // Get client info to use for agent name
          const { data: clientData } = await supabase
            .from('clients')
            .select('client_name, agent_name')
            .eq('id', clientId)
            .single();
          
          const agentName = clientData?.agent_name || 'AI Assistant';
          
          // Create default agent config
          await supabase
            .from('ai_agents')
            .insert({
              client_id: clientId,
              name: agentName,
              interaction_type: 'config',
              content: '',
              settings: {
                agent_name: agentName,
                created_at: new Date().toISOString()
              },
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
          console.log("Created default agent config with name:", agentName);
        }
      } catch (err) {
        console.error("Failed to ensure agent config exists:", err);
      }
    };
    
    ensureAgentConfig();
  }, [clientId]);

  const handleUploadDocument = async (file: File) => {
    try {
      // Add size check to prevent large file uploads
      if (file.size > MAX_FILE_SIZE) {
        toast.error('File size exceeds 50MB limit. Please upload a smaller file.');
        return;
      }

      await uploadDocument(file);
      
      // Log the activity
      await logClientActivity('DOCUMENT_UPLOADED', {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        client_id: clientId
      });

      // Notify parent component about the change
      if (onResourceChange) {
        await onResourceChange();
      }
      
      toast.success('Document uploaded successfully');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Create wrapper functions to handle the logClientActivity with parameters
  const handleLogWebsiteActivity = async () => {
    await logClientActivity('WEBSITE_ADDED', { client_id: clientId });
  };

  const handleLogDocumentActivity = async () => {
    await logClientActivity('DOCUMENT_ADDED', { client_id: clientId });
  };
  
  return (
    <div className="space-y-8">
      <WebsiteResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={handleLogWebsiteActivity}
      />
      
      <DocumentResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={handleLogDocumentActivity}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload PDF, Word, or text documents to enhance your AI assistant's knowledge. Maximum file size: 50MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DocumentUploadForm
            onSubmitDocument={handleUploadDocument}
            isUploading={isUploading}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default ClientResourceSections;
