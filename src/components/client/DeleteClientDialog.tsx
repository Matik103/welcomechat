
import React, { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { sendDeletionEmail } from '@/services/emailService';
import { Client } from '@/types/client';

interface DeleteClientDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose?: () => void;
  onDeleted?: () => void;
  onClientsUpdated?: () => void;
}

export const DeleteClientDialog: React.FC<DeleteClientDialogProps> = ({
  client,
  open,
  onOpenChange,
  onClose,
  onDeleted,
  onClientsUpdated
}) => {
  const [deleteText, setDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
  };

  const handleDeleted = () => {
    if (onDeleted) onDeleted();
    if (onClientsUpdated) onClientsUpdated();
  };

  const deleteClient = async () => {
    try {
      setIsDeleting(true);
      
      if (deleteText !== 'delete schedule') {
        toast.error("Please type 'delete schedule' to confirm.");
        setIsDeleting(false);
        return;
      }
      
      // Validate client data
      if (!client || !client.id) {
        toast.error("Invalid client data");
        setIsDeleting(false);
        return;
      }
      
      // Current date
      const now = new Date();
      
      // Calculate 30 days from now for deletion date
      const deletionDate = new Date();
      deletionDate.setDate(now.getDate() + 30);
      
      console.log(`Scheduling deletion for ${client.client_name} on ${deletionDate.toISOString()}`);
      
      // Update the client with deletion_scheduled_at and status
      const { error: updateError } = await supabase
        .from('ai_agents')
        .update({
          deletion_scheduled_at: deletionDate.toISOString(),
          status: 'inactive'
        })
        .eq('id', client.id)
        .eq('interaction_type', 'config');
      
      if (updateError) {
        console.error("Error scheduling deletion:", updateError);
        toast.error(`Error scheduling deletion: ${updateError.message}`);
        setIsDeleting(false);
        return;
      }
      
      // Send email notification
      await sendDeletionEmail(client.email, client.client_name, deletionDate);
      
      // Log the activity using a valid activity type
      const { error: activityError } = await supabase
        .from('ai_agents')
        .insert({
          client_id: client.id,
          interaction_type: 'activity_log',
          name: 'Activity Logger',
          type: 'client_deletion_scheduled',
          content: `Deletion scheduled for client: ${client.client_name}`,
          metadata: {
            action: 'deletion_scheduled',
            client_name: client.client_name,
            scheduled_deletion_date: deletionDate.toISOString(),
            initiated_at: now.toISOString()
          }
        });
      
      if (activityError) {
        console.error("Error logging deletion activity:", activityError);
        // Continue even if activity logging fails
      }
      
      toast.success(`${client.client_name} has been scheduled for deletion in 30 days`);
      handleClose();
      handleDeleted();
    } catch (error: any) {
      console.error("Error in deleteClient:", error);
      toast.error(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeleting}>
          Schedule Deletion
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will schedule the client for deletion in 30 days.
            Please type <span className="font-medium">delete schedule</span> to confirm.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-2">
          <Input
            type="text"
            value={deleteText}
            onChange={(e) => setDeleteText(e.target.value)}
            placeholder="delete schedule"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteClient} disabled={isDeleting}>
            {isDeleting ? 'Scheduling...' : 'Schedule Deletion'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
