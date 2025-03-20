
import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { DocumentLink } from '@/types/client';
import { ActivityType } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';

interface DocumentResourcesSectionProps {
  children: React.ReactNode;
  clientId: string;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
  agentName: string;
}

export const DocumentResourcesSection = ({ 
  children,
  clientId,
  logActivity,
  agentName
}: DocumentResourcesSectionProps) => {
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
