
import { WebsiteUrls } from "@/components/client/WebsiteUrls";
import { WebsiteUrl } from "@/types/client";
import { Json } from "@/integrations/supabase/types";
import { ExtendedActivityType } from "@/types/activity";

interface WebsiteResourcesSectionProps {
  websiteUrls: WebsiteUrl[];
  addWebsiteUrlMutation: any;
  deleteWebsiteUrlMutation: any;
  clientId: string;
  agentName: string | null | undefined;
  isClientView: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
}

export const WebsiteResourcesSection = ({
  websiteUrls,
  addWebsiteUrlMutation,
  deleteWebsiteUrlMutation,
  clientId,
  agentName,
  isClientView,
  logClientActivity
}: WebsiteResourcesSectionProps) => {
  return (
    <div className="mt-8 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Website URLs</h3>
      <WebsiteUrls
        clientId={clientId}
        agentName={agentName || undefined}
        isClientView={isClientView}
        logClientActivity={logClientActivity}
      />
    </div>
  );
};
