
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Agent } from '@/types/agent';
import { toast } from 'sonner';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AgentDetailsTabProps {
  agent: Agent;
  onUpdateAgent: () => void;
  onDelete: () => void;
}

export function AgentDetailsTab({ agent, onUpdateAgent, onDelete }: AgentDetailsTabProps) {
  const [name, setName] = useState(agent.name);
  const [description, setDescription] = useState(agent.agent_description || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleUpdateAgent = async () => {
    if (!name.trim()) {
      toast.error("Agent name cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('ai_agents')
        .update({
          name: name,
          agent_description: description,
          updated_at: new Date().toISOString()
        })
        .eq('id', agent.id);

      if (error) throw error;
      
      toast.success("Agent updated successfully");
      onUpdateAgent();
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error(`Failed to update agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Agent Name</Label>
          <Input 
            id="name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Enter agent name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea 
            id="description" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a description for this agent"
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {!showDeleteConfirm ? (
            <Button 
              variant="destructive" 
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Agent
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm text-destructive">Are you sure?</span>
              <Button 
                size="sm" 
                variant="destructive" 
                onClick={onDelete}
              >
                Yes, Delete
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleUpdateAgent}
          disabled={isUpdating}
        >
          {isUpdating ? 'Updating...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
