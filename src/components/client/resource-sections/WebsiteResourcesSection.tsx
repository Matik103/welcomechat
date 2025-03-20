
import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { ActivityType } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';

interface WebsiteResourcesSectionProps {
  children: React.ReactNode;
  clientId: string;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
  agentName?: string;
}

export const WebsiteResourcesSection = ({ 
  children,
  clientId,
  logActivity,
  agentName = "AI Assistant"
}: WebsiteResourcesSectionProps) => {
  const handleWebsiteUrlAdded = async (data: { url: string; refresh_rate: number }) => {
    await logActivity(
      "website_url_added", 
      `Added website URL: ${data.url}`,
      {
        url: data.url,
        refresh_rate: data.refresh_rate
      }
    );
  };

  const handleWebsiteUrlDeleted = async (urlId: number) => {
    await logActivity(
      "website_url_deleted",
      `Removed website URL`,
      { urlId }
    );
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Website Resources</AlertTitle>
        <AlertDescription>
          Add URLs to websites that {agentName} should learn from and reference.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        {children}
      </Card>
    </div>
  );
};
