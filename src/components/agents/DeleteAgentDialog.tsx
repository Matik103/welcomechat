
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { updateAgentStatus } from '@/services/agentService';
import { toast } from 'sonner';

interface DeleteAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
  agentName: string;
  onAgentDeleted: () => void;
}

export function DeleteAgentDialog({
  open,
  onOpenChange,
  agentId,
  agentName,
  onAgentDeleted
}: DeleteAgentDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    
    try {
      // Instead of hard-deleting, we just set the status to "inactive"
      const success = await updateAgentStatus(agentId, 'inactive');
      
      if (!success) {
        throw new Error('Failed to delete agent');
      }
      
      toast.success(`Agent "${agentName}" deleted successfully`);
      onAgentDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error(`Failed to delete agent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this agent?</AlertDialogTitle>
          <AlertDialogDescription>
            This will deactivate the agent "{agentName}". This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
