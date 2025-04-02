
import React, { useEffect, useState } from 'react';
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DocumentUploadForm } from './drive-links/DocumentUploadForm';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { toast } from 'sonner';
import { fixAllDocumentPermissions, ensureDocumentStorageBucket } from '@/utils/applyDocumentLinksRLS';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const { uploadDocument, isUploading } = useDocumentUpload(clientId);
  const [isFixingRls, setIsFixingRls] = useState(false);
  const [hasRlsError, setHasRlsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    
    // Also check document permissions on load
    ensureDocumentStorageBucket()
      .then(result => {
        if (!result.success) {
          setHasRlsError(true);
          setErrorMessage(result.message || "Error ensuring document storage bucket");
        }
      })
      .catch(err => {
        console.error("Error checking bucket:", err);
      });
  }, [clientId]);

  const handleFixPermissions = async () => {
    setIsFixingRls(true);
    setErrorMessage(null);
    
    try {
      const result = await fixAllDocumentPermissions();
      
      if (result.success) {
        toast.success("Security policies updated successfully");
        setHasRlsError(false);
      } else {
        toast.error(result.message || "Failed to update security policies. Please contact support.");
        setErrorMessage(result.message || "Unknown error occurred");
      }
    } catch (error) {
      console.error("Failed to fix permissions:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error(`Failed to update security policies: ${errorMessage}`);
      setErrorMessage(errorMessage);
    } finally {
      setIsFixingRls(false);
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
      
      // Set RLS error flag if this looks like a permission problem
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const isPossiblePermissionError = 
        errorMessage.includes('permission denied') || 
        errorMessage.includes('not authorized') || 
        errorMessage.includes('violates row-level security') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Failed to get agent name');
      
      if (isPossiblePermissionError) {
        setHasRlsError(true);
        setErrorMessage(errorMessage);
        toast.error("Permission error detected. Try using the 'Fix Security Permissions' button below.");
      } else {
        toast.error(`Failed to upload document: ${errorMessage}`);
      }
    }
  };
  
  return (
    <div className="space-y-8">
      {hasRlsError && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <ShieldAlert className="h-6 w-6 text-yellow-600 mt-1 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <h3 className="font-medium text-yellow-800">Security Permission Issue Detected</h3>
                <p className="text-yellow-700 text-sm">
                  There appears to be a problem with database permissions. Click the button below to fix it.
                </p>
                {errorMessage && (
                  <p className="text-xs text-yellow-600 bg-yellow-100 p-2 rounded">
                    Error details: {errorMessage}
                  </p>
                )}
                <Button 
                  variant="outline" 
                  onClick={handleFixPermissions}
                  disabled={isFixingRls}
                  className="mt-2"
                >
                  {isFixingRls ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Fixing Security Permissions...
                    </>
                  ) : (
                    'Fix Security Permissions'
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
