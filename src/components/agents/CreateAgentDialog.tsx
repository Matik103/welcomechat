
import { useState } from 'react';
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
import { createOpenAIAssistant } from '@/utils/openAIUtils';

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string | undefined;
  clientName: string;
  onAgentCreated: (agent: any) => void;
}

export function CreateAgentDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  onAgentCreated
}: CreateAgentDialogProps) {
  const [agentName, setAgentName] = useState('');
  const [agentDescription, setAgentDescription] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { ensureAiAgentExists, isCreating } = useAiAgentManagement();

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
    
    if (!clientId) {
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
      let logoUrl = "";
      let logoPath = "";
      
      if (logoFile) {
        // Logic to upload logo would go here
        // For now, just use the preview as the URL
        logoUrl = logoPreview || "";
        logoPath = `/client-logos/${clientId}/${logoFile.name}`;
      }
      
      // Create or update agent
      const { success, agent, error } = await ensureAiAgentExists(
        clientId,
        agentName,
        agentDescription,
        logoUrl,
        logoPath,
        clientName
      );
      
      if (!success || error) {
        throw new Error(error || 'Failed to create agent');
      }
      
      // Try to create OpenAI assistant
      try {
        await createOpenAIAssistant(clientId, agentName, agentDescription, clientName);
      } catch (openAiError) {
        console.error('Error creating OpenAI assistant:', openAiError);
        // Continue with agent creation even if OpenAI assistant creation fails
      }
      
      toast.success(`Agent "${agentName}" created successfully`);
      onAgentCreated(agent);
      
      // Reset form
      setAgentName('');
      setAgentDescription('');
      setLogoFile(null);
      setLogoPreview(null);
      
      // Close dialog
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error(`Failed to create agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New AI Agent</DialogTitle>
          <DialogDescription>
            Create a new AI agent to assist your customers.
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
              <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload className="h-4 w-4" />
                <input
                  id="logo-upload"
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
              <Label htmlFor="agent-name">Agent Name</Label>
              <Input
                id="agent-name"
                placeholder="Enter agent name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent-description">
                Agent Description / System Prompt
              </Label>
              <Textarea
                id="agent-description"
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
              {isSubmitting ? 'Creating...' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
