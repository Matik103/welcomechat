
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DocumentUploadForm } from '@/components/client/DocumentUploadForm';
import { useUnifiedDocumentUpload } from '@/hooks/useUnifiedDocumentUpload';

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
  const {
    uploadDocument,
    isUploading,
    uploadProgress
  } = useUnifiedDocumentUpload(clientId);

  const handleDocumentSubmit = async (file: File) => {
    try {
      await uploadDocument(file, {
        syncToAgent: true,
        syncToProfile: true,
        syncToWidgetSettings: true,
        activityMessage: `Document uploaded: ${file.name}`
      });
      
      // Log client activity
      await logClientActivity();
      
      // Notify parent component
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Document upload error:', error);
      throw error;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Documents</CardTitle>
      </CardHeader>
      <CardContent>
        <DocumentUploadForm 
          onSubmitDocument={handleDocumentSubmit}
          isUploading={isUploading}
          syncOptions={{
            syncToAgent: true,
            syncToProfile: true,
            syncToWidgetSettings: true
          }}
        />
        
        {isUploading && uploadProgress > 0 && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2.5 mb-1">
              <div 
                className="bg-primary h-2.5 rounded-full" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 text-right">
              {uploadProgress < 100 ? 'Processing...' : 'Complete'} ({uploadProgress}%)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
