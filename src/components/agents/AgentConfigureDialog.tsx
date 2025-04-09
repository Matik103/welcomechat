
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Agent } from '@/types/agent';
import { AgentDetailsTab } from './configure-tabs/AgentDetailsTab';
import { KnowledgeBaseTab } from './configure-tabs/KnowledgeBaseTab';

interface AgentConfigureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  onUpdateAgent: () => void;
  onDelete: () => void;
}

export function AgentConfigureDialog({
  open,
  onOpenChange,
  agent,
  onUpdateAgent,
  onDelete
}: AgentConfigureDialogProps) {
  const [activeTab, setActiveTab] = useState('details');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure "{agent.name}" Agent</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="details">Agent Details</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details">
            <AgentDetailsTab
              agent={agent}
              onUpdateAgent={onUpdateAgent} 
              onDelete={onDelete}
            />
          </TabsContent>
          
          <TabsContent value="knowledge">
            <KnowledgeBaseTab 
              clientId={agent.client_id}
              agentName={agent.name}
              onResourceChange={onUpdateAgent}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
