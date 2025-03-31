
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAiAgentManagement } from '@/hooks/useAiAgentManagement';
import type { Agent } from '@/services/agentService';

interface EditAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
  onAgentUpdated: () => void;
}

export function EditAgentDialog({
  open,
  onOpenChange,
  agent,
  onAgentUpdated
}: EditAgentDialogProps) {
  const [agentName, setAgentName] = useState(agent.name);
  const [agentDescription, setAgentDescription] = useState(agent.agent_description || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(agent.logo_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { ensureAiAgentExists, isCreating } = useAiAgentManagement();

  // Update form when agent changes
  useEffect(() => {
    if (open) {
      setAgentName(agent.name);
      setAgentDescription(agent.agent_description || '');
      setLogoPreview(agent.logo_url || null);
    }
  }, [agent, open]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agent.client_id) {
      toast.error('Client ID is required');
      return;
    }
    
    if (!agentName.trim()) {
      toast.error('Agent name is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Upload logo if provided
      let logoUrl = agent.logo_url || "";
      let logoPath = "";
      
      if (logoFile) {
        // Logic to upload logo would go here
        // For now, just use the preview as the URL
        logoUrl = logoPreview || "";
        logoPath = `/client-logos/${agent.client_id}/${logoFile.name}`;
      }
      
      // Update agent
      const { success, error } = await ensureAiAgentExists(
        agent.client_id,
        agentName,
        agentDescription,
        logoUrl,
        logoPath,
        agent.client_name
      );
      
      if (!success || error) {
        throw new Error(error || 'Failed to update agent');
      }
      
      toast.success(`Agent "${agentName}" updated successfully`);
      onAgentUpdated();
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error(`Failed to update agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit AI Agent</DialogTitle>
          <DialogDescription>
            Modify your AI agent's settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {logoPreview ? (
                  <AvatarImage src={logoPreview} alt="Agent logo preview" />
                ) : null}
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                  <Bot className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <label htmlFor="logo-upload-edit" className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload className="h-4 w-4" />
                <input
                  id="logo-upload-edit"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agent-name-edit">Agent Name</Label>
              <Input
                id="agent-name-edit"
                placeholder="Enter agent name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-description-edit">
                Agent Description / System Prompt
              </Label>
              <Textarea
                id="agent-description-edit"
                placeholder="Describe your agent and its purpose..."
                className="min-h-[120px]"
                value={agentDescription}
                onChange={(e) => setAgentDescription(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This description is used as the system prompt for the AI.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !agentName.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
