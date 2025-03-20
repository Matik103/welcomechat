
import React from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Globe } from 'lucide-react';
import { ActivityType, Json } from '@/integrations/supabase/types';

interface WebsiteResourcesSectionProps {
  children: React.ReactNode;
  clientId: string;
  logActivity: (activityType: ActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteResourcesSection = ({ 
  children,
  clientId,
  logActivity
}: WebsiteResourcesSectionProps) => {
  const trackActivity = async (urlId: number) => {
    try {
      await logActivity(
        "website_url_deleted",
        `Website URL was deleted`,
        { url_id: urlId, client_id: clientId }
      );
    } catch (error) {
      console.error("Error logging website URL deletion:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Globe className="h-4 w-4" />
        <AlertTitle>Website URLs</AlertTitle>
        <AlertDescription>
          Add URLs to websites that contain information for the AI agent to learn from.
          These URLs will be crawled periodically to keep the AI's knowledge up to date.
        </AlertDescription>
      </Alert>

      <Card className="p-6">
        {children}
      </Card>
    </div>
  );
};
