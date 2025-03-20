
import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { DocumentLink } from '@/types/client';

interface DocumentResourcesSectionProps {
  children: React.ReactNode;
  clientId: string;
  logActivity: (activity_type: string, description: string, metadata?: any) => Promise<void>;
  agentName: string;
}

export const DocumentResourcesSection = ({ 
  children,
  clientId,
  logActivity,
  agentName
}: DocumentResourcesSectionProps) => {
  const handleDocumentLinkAdded = async (data: { link: string; refresh_rate: number; document_type?: string }) => {
    await logActivity(
      "document_link_added", 
      `Added ${data.document_type || 'document'} link: ${data.link}`,
      {
        link: data.link,
        refresh_rate: data.refresh_rate,
        document_type: data.document_type
      }
    );
  };

  const handleDocumentLinkDeleted = async (linkId: number) => {
    await logActivity(
      "document_link_deleted",
      `Removed document link`,
      { linkId }
    );
  };

  const handleFileUploaded = async (file: File) => {
    await logActivity(
      "document_uploaded",
      `Uploaded document: ${file.name}`,
      {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      }
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Document Resources</AlertTitle>
        <AlertDescription>
          Add Google Drive links to documents that contain information for {agentName} to learn from.
          You can also upload PDF documents directly.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        {children}
      </Card>
    </div>
  );
};
