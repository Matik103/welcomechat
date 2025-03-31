
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAiAgentManagement } from '@/hooks/useAiAgentManagement';
import { AgentFormFields } from './dialogs/AgentFormFields';
import { useAgentFormState } from './dialogs/useAgentFormState';
import { useAgentFormSubmit } from './dialogs/useAgentFormSubmit';

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
  const { ensureAiAgentExists, isCreating } = useAiAgentManagement();
  
  const {
    agentName,
    setAgentName,
    agentDescription,
    setAgentDescription,
    logoFile,
    logoPreview,
    isSubmitting,
    setIsSubmitting,
    handleLogoChange,
    resetForm
  } = useAgentFormState();

  const { handleSubmit } = useAgentFormSubmit({
    clientId,
    clientName,
    agentName,
    agentDescription,
    logoFile,
    logoPreview,
    setIsSubmitting,
    resetForm,
    onOpenChange,
    onAgentCreated,
    ensureAiAgentExists
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New AI Agent</DialogTitle>
          <DialogDescription>
            Create a new AI agent to assist your customers.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <AgentFormFields
            agentName={agentName}
            setAgentName={setAgentName}
            agentDescription={agentDescription}
            setAgentDescription={setAgentDescription}
            logoFile={logoFile}
            logoPreview={logoPreview}
            handleLogoChange={handleLogoChange}
          />
          
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
