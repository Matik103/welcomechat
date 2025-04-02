
import React, { useEffect, useState } from 'react';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { supabase } from '@/integrations/supabase/client';
import { fixDocumentLinksRLS } from '@/utils/applyDocumentLinksRLS';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2 } from 'lucide-react';

interface ClientResourceSectionsProps {
  clientId: string;
  onResourceChange?: () => void;
  logClientActivity: () => Promise<void>; // Required callback
}

export const ClientResourceSections = ({
  clientId,
  onResourceChange,
  logClientActivity
}: ClientResourceSectionsProps) => {
  const { uploadDocument, isUploading, bucketError, fixPermissions } = useDocumentUpload(clientId);
  const [isFixingPermissions, setIsFixingPermissions] = useState(false);

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

  const handleFixPermissions = async () => {
    setIsFixingPermissions(true);
    try {
      const result = await fixDocumentLinksRLS();
      if (result.success) {
        toast.success("Security permissions fixed successfully");
      } else {
        toast.error(`Failed to fix permissions: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to fix permissions:", error);
      toast.error(`Error fixing permissions: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsFixingPermissions(false);
    }
  };

  const handleUploadDocument = async (file: File) => {
    // Add size check to prevent large file uploads that would slow down the system
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size exceeds 10MB limit. Please upload a smaller file.');
      return;
    }
    
    try {
      console.log("Uploading document for client:", clientId);
      await uploadDocument(file);
      toast.success('Document uploaded successfully');
      
      // Log client activity
      await logClientActivity();
      
      // Also log specific document activity with client_id
      await createClientActivity(
        clientId,
        undefined,
        ActivityType.DOCUMENT_ADDED,
        `Document uploaded: ${file.name}`,
        {
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          client_id: clientId
        }
      );
      
      // Notify parent component about the change
      if (onResourceChange) {
        onResourceChange();
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to upload document: ${errorMessage}`);
    }
  };
  
  return (
    <div className="space-y-8">
      <WebsiteResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={logClientActivity}
      />
      
      <DocumentResourcesSection 
        clientId={clientId}
        onResourceChange={onResourceChange}
        logClientActivity={logClientActivity}
      />
      
      <Card>
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
          <CardDescription>
            Upload PDF, Word, or text documents to enhance your AI assistant's knowledge
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bucketError && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
              <div className="flex-1">
                <p className="text-yellow-800 font-medium">Storage bucket issue detected</p>
                <p className="text-sm text-yellow-700 mt-1">{bucketError}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFixPermissions}
                  disabled={isFixingPermissions}
                  className="mt-2"
                >
                  {isFixingPermissions ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fixing Permissions...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Fix Security Permissions
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
          
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
