
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from "@/types/client";
import { supabase } from '@/integrations/supabase/client';
import { sendDeletionEmail } from '@/utils/emailUtils';
import { generateRecoveryToken } from '@/utils/clientUtils';

interface DeleteClientConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onClientsUpdated: () => void;
}

export const DeleteClientConfirmDialog = ({
  isOpen,
  onOpenChange,
  client,
  onClientsUpdated
}: DeleteClientConfirmDialogProps) => {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const confirmationText = "delete schedule";
  
  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      setError(null);
      onOpenChange(false);
    }
  };
  
  const isConfirmEnabled = confirmText.toLowerCase() === confirmationText;
  
  const handleDelete = async () => {
    if (!client || !isConfirmEnabled) return;
    
    try {
      setError(null);
      setIsDeleting(true);
      
      console.log(`Scheduling deletion of client: ${client.id}`);
      
      // Set the deletion_scheduled_at timestamp to 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const deletionDate = thirtyDaysFromNow.toISOString();
      const now = new Date().toISOString();
      
      // Generate a recovery token
      const recoveryToken = await generateRecoveryToken(client.id);
      
      // Update the client status
      const { data, error: updateError } = await supabase
        .from('ai_agents')
        .update({ 
          deletion_scheduled_at: deletionDate,
          status: 'scheduled_deletion'
        })
        .eq('id', client.id);
      
      if (updateError) {
        console.error("Error scheduling client deletion:", updateError);
        throw updateError;
      }
      
      // Send email notification to the client
      const emailResult = await sendDeletionEmail(
        client.email, 
        client.client_name, 
        recoveryToken,
        deletionDate
      );
      
      if (!emailResult.emailSent) {
        console.warn("Warning: Failed to send deletion email notification:", emailResult.emailError);
        toast.warning("Client scheduled for deletion, but email notification could not be sent");
      } else {
        // Log the deletion
        console.log('Deletion notification email sent', {
          client_id: client.id,
          client_name: client.client_name,
          email: client.email,
          timestamp: now,
          scheduled_deletion_date: deletionDate
        });
      }
      
      // Record the action in activities table
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          ai_agent_id: client.id,
          type: 'client_deleted', // Changed from 'client_deletion_scheduled' to a valid enum value
          metadata: {
            scheduled_deletion_date: deletionDate,
            client_name: client.client_name,
            recovery_token_generated: !!recoveryToken,
            activity_subtype: 'deletion_scheduled' // Add subtype to preserve original intent
          }
        });
        
      if (activityError) {
        console.warn("Warning: Failed to record deletion activity:", activityError);
      }
      
      // Refresh the client list
      onClientsUpdated();
      
      // Close the dialog and show success message
      toast.success(`${client.client_name} has been scheduled for deletion in 30 days`);
      handleClose();
      
    } catch (err) {
      console.error("Error during client deletion scheduling:", err);
      setError(`Failed to schedule client deletion: ${err instanceof Error ? err.message : String(err)}`);
      toast.error("Failed to schedule client deletion");
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Schedule Client Deletion</DialogTitle>
          <DialogDescription>
            This action will schedule the client for deletion in 30 days. The client will receive an email with recovery instructions.
          </DialogDescription>
        </DialogHeader>

        {client && (
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                <p className="font-medium">Warning:</p>
                <p>After 30 days, all client data will be permanently removed, including:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Website URLs and content</li>
                  <li>Document links and content</li>
                  <li>Chat history and interactions</li>
                  <li>All client settings</li>
                </ul>
                <p className="mt-2">The client can recover their account within the 30-day period by clicking the recovery link in the email notification.</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirm" className="text-sm">
                  Type <span className="font-bold">{confirmationText}</span> to confirm
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={confirmationText}
                  disabled={isDeleting}
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={!isConfirmEnabled || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling Deletion...
              </>
            ) : (
              'Schedule Deletion'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteClientConfirmDialog;
