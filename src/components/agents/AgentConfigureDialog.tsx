
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentDetailsTab } from './configure-tabs/AgentDetailsTab';
import { DocumentsTab } from './configure-tabs/DocumentsTab';
import { GoogleDriveTab } from './configure-tabs/GoogleDriveTab';
import { WebsiteUrlsTab } from './configure-tabs/WebsiteUrlsTab';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { Agent } from "@/types/agent";
import { toast } from "sonner";

interface AgentConfigureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  onAgentUpdated: (agent: Agent) => void;
}

export function AgentConfigureDialog({
  open,
  onOpenChange,
  agent,
  onAgentUpdated,
}: AgentConfigureDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  
  // Handle successful resource changes
  const handleResourceChange = () => {
    toast.success("Agent resources updated successfully");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure AI Agent: {agent.name}</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="drive">Google Drive</TabsTrigger>
            <TabsTrigger value="websites">Websites</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <AgentDetailsTab 
              agent={agent} 
              onAgentUpdated={onAgentUpdated} 
            />
          </TabsContent>
          
          <TabsContent value="documents">
            <DocumentsTab 
              clientId={agent.client_id}
              agentName={agent.name}
              onSuccess={handleResourceChange}
            />
          </TabsContent>
          
          <TabsContent value="drive">
            <GoogleDriveTab 
              clientId={agent.client_id} 
              onResourceChange={handleResourceChange} 
            />
          </TabsContent>
          
          <TabsContent value="websites">
            <WebsiteUrlsTab 
              clientId={agent.client_id}
              onResourceChange={handleResourceChange}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
