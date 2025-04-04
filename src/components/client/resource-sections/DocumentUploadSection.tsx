
import React, { useState } from 'react';
import { DocumentUpload } from '@/components/client/DocumentUpload';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientActivity } from '@/services/clientActivityService';
import { ActivityType } from '@/types/activity';

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
  const handleUploadComplete = async (result: {
    success: boolean;
    error?: string;
    documentId?: string;
    publicUrl?: string;
  }) => {
    if (result.success) {
      try {
        // Log activity
        await createClientActivity(
          clientId,
          undefined,
          ActivityType.DOCUMENT_UPLOADED,
          `Document uploaded successfully`,
          {
            document_id: result.documentId,
            client_id: clientId,
          }
        );
      } catch (activityError) {
        console.error("Error logging activity:", activityError);
      }
      
      // Call the parent's upload complete handler
      await logClientActivity();
      if (onUploadComplete) onUploadComplete();
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
        <DocumentUpload
          clientId={clientId}
          onUploadComplete={handleUploadComplete}
        />
      </CardContent>
    </Card>
  );
};
