
import React, { useState, useEffect } from 'react';
import { DocumentUpload } from '@/components/client/DocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, CheckCircle2, Loader2, KeyRound, InfoIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fixDocumentContentRLS, checkDocumentContentRLS } from '@/utils/applyDocumentContentRLS';
import { toast } from 'sonner';
import { UploadResult } from '@/hooks/useUnifiedDocumentUpload';
import { RAPIDAPI_KEY } from '@/config/env';

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
  const [checkingPermissions, setCheckingPermissions] = useState<boolean>(true);
  
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        setCheckingPermissions(true);
        console.log('Checking document content permissions...');
        const result = await checkDocumentContentRLS();
        
        if (result.success) {
          console.log('Document content permissions are correctly configured');
          setPermissionStatus('Permissions verified');
        } else {
          console.log('Document content permissions need fixing:', result.message);
          setPermissionStatus('Permission issues detected. Click "Fix Permissions" to resolve.');
          setLastError(result.message || 'Permission issue detected');
        }
      } catch (err) {
        console.error("Failed to check permissions:", err);
        setPermissionStatus('Error checking permissions');
      } finally {
        setCheckingPermissions(false);
      }
    };
    
    const checkApiKey = () => {
      const hasApiKey = !!RAPIDAPI_KEY && RAPIDAPI_KEY.length > 10;
      setApiKeyMissing(!hasApiKey);
      console.log("Using RapidAPI key:", hasApiKey ? "Key is set" : "Key is missing");
      
      if (!hasApiKey) {
        toast.warning('RapidAPI key is missing. PDF text extraction will not work properly.', {
          description: 'Add VITE_RAPIDAPI_KEY to your environment variables.',
          duration: 5000,
          id: 'rapidapi-key-missing'
        });
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
        
        await logClientActivity();
        if (onUploadComplete) onUploadComplete();
      } catch (activityError) {
        console.error("Error logging activity:", activityError);
        setLastError(`Upload succeeded but failed to log activity: ${activityError instanceof Error ? activityError.message : String(activityError)}`);
      }
    } else {
      console.error("Upload failed:", result.error);
      setLastError(result.error || "Unknown error during upload");
      
      if (result.error && (result.error.includes('API key') || result.error.includes('401') || result.error.includes('Invalid API key'))) {
        setApiKeyMissing(true);
        toast.error('RapidAPI key is invalid or missing', {
          description: 'Please check your VITE_RAPIDAPI_KEY environment variable.',
          duration: 8000
        });
      }
      
      if (result.error && (result.error.includes('row-level security') || result.error.includes('permission denied') || result.error.includes('policy'))) {
        setPermissionStatus('Permission denied. Click "Fix Permissions" to resolve this issue.');
        toast.error('Database permission error', {
          description: 'Click "Fix Permissions" below to resolve this issue.',
          duration: 8000
        });
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
        {checkingPermissions && (
          <Alert variant="default" className="bg-blue-50 border border-blue-200 mb-4">
            <InfoIcon className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Checking document upload permissions...
            </AlertDescription>
          </Alert>
        )}
        
        {apiKeyMissing && (
          <Alert variant="warning" className="bg-red-50 border border-red-200 mb-4">
            <KeyRound className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>RapidAPI Key Issue:</strong> The RapidAPI key is missing or invalid. 
              Please add <code>VITE_RAPIDAPI_KEY</code> to your environment variables for PDF text extraction.
            </AlertDescription>
          </Alert>
        )}
        
        {permissionStatus && !checkingPermissions && (
          <Alert variant={permissionStatus.includes('successful') || permissionStatus.includes('fixed') || permissionStatus.includes('verified') 
                  ? "default" 
                  : "warning"} 
                className={permissionStatus.includes('successful') || permissionStatus.includes('fixed') || permissionStatus.includes('verified') 
                  ? "bg-green-50 border border-green-200 mb-4" 
                  : "bg-yellow-50 border border-yellow-200 mb-4"}>
            {permissionStatus.includes('successful') || permissionStatus.includes('fixed') || permissionStatus.includes('verified') ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription className={permissionStatus.includes('successful') || permissionStatus.includes('fixed') || permissionStatus.includes('verified') 
              ? "text-green-800" 
              : "text-yellow-800"}>
              {permissionStatus}
              {!permissionStatus.includes('successful') && 
               !permissionStatus.includes('fixed') && 
               !permissionStatus.includes('verified') && 
               !permissionStatus.includes('Fixing') && (
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
        
        {lastError && !apiKeyMissing && !lastError.includes('Permission') && !lastError.includes('policy') && (
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
