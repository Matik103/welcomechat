
import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { FileText } from 'lucide-react';
import { ActivityType, Json } from '@/integrations/supabase/types';

interface DocumentResourcesSectionProps {
  children: React.ReactNode;
  clientId: string;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const DocumentResourcesSection = ({ 
  children,
  clientId,
  logActivity
}: DocumentResourcesSectionProps) => {
  return (
    <div className="space-y-6">
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertTitle>Document Links</AlertTitle>
        <AlertDescription>
          Add links to Google Drive documents or upload files directly to provide your AI agent with more knowledge.
          Documents are processed to extract text and make them searchable.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        {children}
      </Card>
    </div>
  );
};
