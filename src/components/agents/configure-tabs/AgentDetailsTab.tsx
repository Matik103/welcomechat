
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useAiAgentManagement } from '@/hooks/useAiAgentManagement';
import { handleLogoUpload } from '@/services/uploadService';
import type { Agent } from '@/services/agentService';

interface AgentDetailsTabProps {
  agent: Agent;
  onAgentUpdated: () => void;
  onClose: () => void;
}

export function AgentDetailsTab({ agent, onAgentUpdated, onClose }: AgentDetailsTabProps) {
  const [agentName, setAgentName] = useState(agent.name);
  const [agentDescription, setAgentDescription] = useState(agent.agent_description || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(agent.logo_url || null);
  const [isLogoUploading, setIsLogoUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { ensureAiAgentExists } = useAiAgentManagement();

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setLogoFile(file);
    
    try {
      setIsLogoUploading(true);
      const uploadResult = await handleLogoUpload(e, agent.client_id);
      
      if (uploadResult) {
        // Update the preview with the actual URL
        setLogoPreview(uploadResult.url);
        toast.success('Logo uploaded successfully');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setIsLogoUploading(false);
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
      // Use the actual uploaded URL or the preview
      const logoUrl = logoPreview || "";
      let logoPath = agent.logo_storage_path || "";
      
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
      onClose();
    } catch (error) {
      console.error('Error updating agent:', error);
      toast.error(`Failed to update agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={isLogoUploading}
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
            className="min-h-[150px]"
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            This description is used as the system prompt for the AI.
          </p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting || isLogoUploading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || isLogoUploading || !agentName.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}
