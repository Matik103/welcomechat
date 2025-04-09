
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Agent } from '@/types/agent';
import { Button } from '@/components/ui/button';
import { AgentDetailsTab } from './configure-tabs/AgentDetailsTab';

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
            <div className="space-y-4 py-4">
              <div className="text-center py-8">
                <h3 className="text-lg font-medium">Knowledge Base Configuration</h3>
                <p className="text-muted-foreground mt-2">
                  Coming soon: Connect documents, websites, and other knowledge sources to your AI agent.
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setActiveTab('details')}>
                  Go Back to Details
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
