
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Trash } from 'lucide-react';
import { AgentDetailsTab } from './configure-tabs/AgentDetailsTab';
import { DocumentsTab } from './configure-tabs/DocumentsTab';
import { GoogleDriveTab } from './configure-tabs/GoogleDriveTab';
import { WebsiteUrlsTab } from './configure-tabs/WebsiteUrlsTab';
import type { Agent } from '@/services/agentService';

interface AgentConfigureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  onAgentUpdated: () => void;
  onDelete: () => void;
}

export function AgentConfigureDialog({
  open,
  onOpenChange,
  agent,
  onAgentUpdated,
  onDelete
}: AgentConfigureDialogProps) {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure AI Agent: {agent.name}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="details">Agent Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="drive">Google Drive</TabsTrigger>
            <TabsTrigger value="websites">Website URLs</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <AgentDetailsTab 
              agent={agent} 
              onAgentUpdated={onAgentUpdated} 
              onClose={() => onOpenChange(false)} 
            />
          </TabsContent>
          
          <TabsContent value="documents">
            <DocumentsTab 
              clientId={agent.client_id}
              agentName={agent.name}
              onSuccess={onAgentUpdated}
            />
          </TabsContent>
          
          <TabsContent value="drive">
            <GoogleDriveTab 
              clientId={agent.client_id}
              agentName={agent.name}
              onSuccess={onAgentUpdated}
            />
          </TabsContent>
          
          <TabsContent value="websites">
            <WebsiteUrlsTab 
              clientId={agent.client_id}
              agentName={agent.name}
              onSuccess={onAgentUpdated}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6 flex justify-between">
          <Button
            variant="destructive"
            onClick={onDelete}
            type="button"
          >
            <Trash className="h-4 w-4 mr-2" />
            Delete Agent
          </Button>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
