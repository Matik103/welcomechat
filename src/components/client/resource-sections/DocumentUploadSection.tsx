
import React, { useState, useEffect } from 'react';
import { DocumentUpload } from '@/components/client/DocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, CheckCircle2, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fixDocumentContentRLS, checkDocumentContentRLS } from '@/utils/applyDocumentContentRLS';
import { toast } from 'sonner';
import { UploadResult } from '@/hooks/useUnifiedDocumentUpload';

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
  const [apiKeyMissing, setApiKeyMissing] = useState<boolean>(false);
  
  // Check RLS permissions when component mounts
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const result = await checkDocumentContentRLS();
        if (!result.success) {
          console.log('Document content permissions need fixing, applying automatically...');
          await handleFixPermissions();
        }
      } catch (err) {
        console.error("Failed to check permissions:", err);
      }
    };
    
    const checkApiKey = () => {
      const rapidApiKey = import.meta.env.VITE_RAPIDAPI_KEY;
      if (!rapidApiKey) {
        setApiKeyMissing(true);
        console.warn("RapidAPI key is missing. Please set VITE_RAPIDAPI_KEY in your environment.");
      } else {
        setApiKeyMissing(false);
      }
    };
    
    checkPermissions();
    checkApiKey();
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

  const handleUploadComplete = async (result: UploadResult) => {
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
      
      // Check if this is an API key related error
      if (result.error && (result.error.includes('API key') || result.error.includes('401') || result.error.includes('Invalid API key'))) {
        setApiKeyMissing(true);
      }
      
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
          Upload documents to be processed and extracted using RapidAPI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiKeyMissing && (
          <Alert variant="warning" className="bg-red-50 border border-red-200 mb-4">
            <KeyRound className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>RapidAPI Key Missing:</strong> PDF text extraction requires a valid RapidAPI key. 
              Please add your RapidAPI key to the environment variables as VITE_RAPIDAPI_KEY.
              <div className="mt-2">
                <ul className="list-disc list-inside text-sm">
                  <li>Sign up at <a href="https://rapidapi.com/developer/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">RapidAPI.com</a></li>
                  <li>Subscribe to the <a href="https://rapidapi.com/search/pdf-to-text" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">PDF-to-Text converter</a> API</li>
                  <li>Copy your API key and add it to the .env file</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {permissionStatus && permissionStatus !== 'Permissions verified' && (
          <Alert variant={permissionStatus.includes('successful') || permissionStatus.includes('fixed') 
                  ? "default" 
                  : "warning"} 
                className={permissionStatus.includes('successful') || permissionStatus.includes('fixed') 
                  ? "bg-green-50 border border-green-200 mb-4" 
                  : "bg-yellow-50 border border-yellow-200 mb-4"}>
            {permissionStatus.includes('successful') || permissionStatus.includes('fixed') ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={permissionStatus.includes('successful') || permissionStatus.includes('fixed') 
              ? "text-green-800" 
              : "text-yellow-800"}>
              {permissionStatus}
            </AlertDescription>
          </Alert>
        )}
        
        {lastError && !apiKeyMissing && (
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
