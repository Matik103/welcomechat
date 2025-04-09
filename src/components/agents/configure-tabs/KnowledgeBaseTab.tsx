
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentsTab } from './DocumentsTab';
import { GoogleDriveTab } from './GoogleDriveTab';
import { WebsiteUrlsTab } from './WebsiteUrlsTab';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

export interface KnowledgeBaseTabProps {
  clientId: string;
  agentName: string;
  onResourceChange: () => void;
}

export function KnowledgeBaseTab({ clientId, agentName, onResourceChange }: KnowledgeBaseTabProps) {
  const [activeSubTab, setActiveSubTab] = useState("documents");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Knowledge Base</h3>
        <p className="text-sm text-muted-foreground">
          Train your AI assistant with documents, websites, and other knowledge sources.
        </p>
      </div>

      <Alert variant="default" className="bg-blue-50 border-blue-200">
        <InfoIcon className="h-4 w-4 text-blue-500" />
        <AlertDescription className="text-blue-700">
          All resources added here will be processed and made available to your AI assistant.
        </AlertDescription>
      </Alert>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="google-drive">Google Drive</TabsTrigger>
          <TabsTrigger value="websites">Website URLs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documents" className="py-4">
          <DocumentsTab 
            clientId={clientId} 
            onSuccess={onResourceChange}
          />
        </TabsContent>
        
        <TabsContent value="google-drive" className="py-4">
          <GoogleDriveTab 
            clientId={clientId} 
            agentName={agentName}
            onSuccess={onResourceChange}
          />
        </TabsContent>
        
        <TabsContent value="websites" className="py-4">
          <WebsiteUrlsTab 
            clientId={clientId} 
            agentName={agentName}
            onSuccess={onResourceChange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
