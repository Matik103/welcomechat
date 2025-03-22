
import { WebsiteResourcesSection } from './resource-sections/WebsiteResourcesSection';
import { DocumentResourcesSection } from './resource-sections/DocumentResourcesSection';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExtendedActivityType } from '@/types/activity';
import { Json } from '@/integrations/supabase/types';

interface ClientResourceSectionsProps {
  clientId: string;
  agentName: string;
  isClientView?: boolean;
  logClientActivity: (activity_type: ExtendedActivityType, description: string, metadata?: Json) => Promise<void>;
  className?: string;
}

export const ClientResourceSections = ({
  clientId,
  agentName,
  isClientView = false,
  logClientActivity,
  className = '',
}: ClientResourceSectionsProps) => {
  // This component now simply renders the two resource section components
  return (
    <div className={`space-y-8 ${className}`}>
      <WebsiteResourcesSection
        clientId={clientId}
        agentName={agentName}
        isClientView={isClientView}
        logClientActivity={logClientActivity}
      />
      
      <DocumentResourcesSection
        clientId={clientId}
        agentName={agentName}
        isClientView={isClientView}
        logClientActivity={logClientActivity}
      />
      
      {!isClientView && (
        <Card>
          <CardHeader>
            <CardTitle>API Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              API access management is coming soon. This will allow the client to generate and manage API keys.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
