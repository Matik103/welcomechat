
import React, { useState } from 'react';
import { DocumentUpload } from '@/components/client/DocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fixDocumentContentRLS } from '@/utils/applyDocumentContentRLS';

interface DocumentUploadSectionProps {
  clientId: string;
  logClientActivity: () => Promise<void>;
  onUploadComplete?: () => void;
}

export const DocumentUploadSection: React.FC<DocumentUploadSectionProps> = ({
  clientId,
  logClientActivity,
  onUploadComplete
}) => {
  const [lastError, setLastError] = useState<string | null>(null);
  const [isFixingPermissions, setIsFixingPermissions] = useState(false);
  
  const handleFixPermissions = async () => {
    setIsFixingPermissions(true);
    try {
      const result = await fixDocumentContentRLS();
      
      if (result.success) {
        setLastError("Permissions fixed successfully. Please try uploading again.");
      } else {
        setLastError(`Failed to fix permissions: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to fix permissions:", error);
      setLastError(`Error fixing permissions: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFixingPermissions(false);
    }
  };

  const handleUploadComplete = async (result: {
    success: boolean;
    error?: string;
    documentId?: string;
    publicUrl?: string;
    fileName?: string;
  }) => {
    if (result.success) {
      try {
        setLastError(null);
        
        // Log activity
        await createClientActivity(
          clientId,
          undefined,
          ActivityType.DOCUMENT_ADDED, 
          `Document uploaded: ${result.fileName || 'Unknown document'}`,
          {
            document_id: result.documentId,
            client_id: clientId,
            file_name: result.fileName,
            public_url: result.publicUrl
          }
        );
        
        // Call the parent's upload complete handler
        await logClientActivity();
        if (onUploadComplete) onUploadComplete();
      } catch (activityError) {
        console.error("Error logging activity:", activityError);
        setLastError(`Upload succeeded but failed to log activity: ${activityError instanceof Error ? activityError.message : String(activityError)}`);
      }
    } else {
      console.error("Upload failed:", result.error);
      setLastError(result.error || "Unknown error during upload");
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Document Upload</CardTitle>
        <CardDescription>
          Upload documents to be processed by your AI Assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastError && lastError.includes("row-level security policy") && (
          <Alert variant="warning" className="bg-yellow-50 border border-yellow-200 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {lastError}
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleFixPermissions}
                  disabled={isFixingPermissions}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  {isFixingPermissions ? "Fixing permissions..." : "Fix Permissions"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <DocumentUpload
          clientId={clientId}
          onUploadComplete={handleUploadComplete}
        />
      </CardContent>
    </Card>
  );
};
