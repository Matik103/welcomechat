
import React, { useState, useEffect } from 'react';
import { DocumentUpload } from '@/components/client/DocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fixDocumentContentRLS, checkDocumentContentRLS } from '@/utils/applyDocumentContentRLS';
import { toast } from 'sonner';

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
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  
  // Check RLS permissions when component mounts
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await checkDocumentContentRLS();
        if (!result.success) {
          console.log('Document content permissions need fixing, applying automatically...');
          await handleFixPermissions();
        } else {
          setPermissionStatus('Permissions verified');
        }
      } catch (err) {
        console.error("Failed to check permissions:", err);
      }
    };
    
    checkPermissions();
  }, []);
  
  const handleFixPermissions = async () => {
    setIsFixingPermissions(true);
    setPermissionStatus('Fixing permissions...');
    
    try {
      const result = await fixDocumentContentRLS();
      
      if (result.success) {
        setPermissionStatus('Permissions fixed successfully.');
        setLastError(null);
        toast.success('Document permissions fixed successfully');
      } else {
        setPermissionStatus('Failed to fix permissions.');
        setLastError(`Failed to fix permissions: ${result.message}`);
        toast.error(`Failed to fix permissions: ${result.message}`);
      }
    } catch (error) {
      console.error("Failed to fix permissions:", error);
      setPermissionStatus('Error fixing permissions.');
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
        setPermissionStatus('Upload successful');
        toast.success('Document uploaded successfully');
        
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
      
      // If it's a permissions error, offer to fix it automatically
      if (result.error && (result.error.includes('row-level security') || result.error.includes('permission denied') || result.error.includes('policy'))) {
        setPermissionStatus('Permission denied. Click "Fix Permissions" to resolve this issue.');
      }
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
        {permissionStatus && (
          <Alert variant={permissionStatus.includes('successful') || permissionStatus.includes('verified') ? 'default' : 'warning'} 
                className={permissionStatus.includes('successful') || permissionStatus.includes('verified') 
                  ? "bg-green-50 border border-green-200 mb-4" 
                  : "bg-yellow-50 border border-yellow-200 mb-4"}>
            {permissionStatus.includes('successful') || permissionStatus.includes('verified') ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={permissionStatus.includes('successful') || permissionStatus.includes('verified') 
              ? "text-green-800" 
              : "text-yellow-800"}>
              {permissionStatus}
            </AlertDescription>
          </Alert>
        )}
        
        {lastError && (
          <Alert variant="warning" className="bg-yellow-50 border border-yellow-200 mb-4">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {lastError}
              {(lastError.includes('row-level security policy') || 
                lastError.includes('permission denied') ||
                lastError.includes('policy')) && (
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleFixPermissions}
                    disabled={isFixingPermissions}
                    className="flex items-center gap-2"
                  >
                    {isFixingPermissions ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Fixing permissions...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        Fix Permissions
                      </>
                    )}
                  </Button>
                </div>
              )}
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
