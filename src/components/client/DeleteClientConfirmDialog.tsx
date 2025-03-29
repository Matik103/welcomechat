
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
import { Clock, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Client } from "@/types/client";
import { supabase } from '@/integrations/supabase/client';
import { sendDeletionEmail } from '@/utils/email/deletionEmail';
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
  
  const confirmationText = "schedule deletion";
  
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
      const { error: updateError } = await supabase
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
      let emailSent = false;
      let emailError;
      try {
        const emailResult = await sendDeletionEmail(
          client.email, 
          client.client_name, 
          recoveryToken,
          deletionDate
        );
        
        emailSent = emailResult.emailSent;
        emailError = emailResult.emailError;
        
        if (!emailSent) {
          console.warn("Warning: Failed to send deletion email notification:", emailError);
        } else {
          console.log('Deletion notification email sent', {
            client_id: client.id,
            client_name: client.client_name,
            email: client.email,
            timestamp: now,
            scheduled_deletion_date: deletionDate
          });
        }
      } catch (emailErr) {
        console.error("Error when sending deletion email:", emailErr);
        emailError = emailErr instanceof Error ? emailErr.message : String(emailErr);
      }
      
      // Record the action in activities table
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          ai_agent_id: client.id,
          type: 'client_deleted', // Using a valid enum value
          metadata: {
            scheduled_deletion_date: deletionDate,
            client_name: client.client_name,
            recovery_token_generated: !!recoveryToken,
            activity_subtype: 'deletion_scheduled', // Add subtype to preserve original intent
            email_notification_sent: emailSent,
            email_error: emailError
          }
        });
        
      if (activityError) {
        console.warn("Warning: Failed to record deletion activity:", activityError);
      }
      
      // Refresh the client list
      onClientsUpdated();
      
      // Close the dialog and show appropriate message
      if (emailSent) {
        toast.success(`${client.client_name} has been scheduled for deletion in 30 days`, {
          description: "A recovery link was sent to the client's email."
        });
      } else {
        toast.warning(`${client.client_name} has been scheduled for deletion, but email notification failed`, {
          description: "The client may not receive a recovery link."
        });
      }
      
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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <div className="bg-blue-50 p-4 border-b border-blue-100">
          <DialogHeader>
            <div className="flex items-center gap-2 text-blue-700">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-blue-700 text-xl">Schedule Client Deletion</DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 mt-2">
              This action will schedule the client for deletion after a 30-day grace period.
            </DialogDescription>
          </DialogHeader>
        </div>

        {client && (
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-sm">
                <Clock className="h-5 w-5 text-amber-600 mt-1 flex-shrink-0" />
                <div className="text-amber-800">
                  <p className="font-semibold mb-2">30-Day Grace Period</p>
                  <p className="mb-2">The client will have 30 days to recover their account before permanent deletion.</p>
                  <p className="text-sm">An email with recovery instructions will be sent to <span className="font-medium">{client.email}</span>.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-sm text-gray-800">
                <p className="font-medium mb-2">The following data will be permanently deleted after 30 days:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>All client website data and content</li>
                  <li>Document uploads and linked content</li>
                  <li>Chat history and interactions</li>
                  <li>Client settings and preferences</li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="confirm" className="text-sm font-medium block">
                  Type <span className="font-bold text-blue-600 px-1 py-0.5 bg-blue-50 rounded">{confirmationText}</span> to confirm
                </Label>
                <Input
                  id="confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={confirmationText}
                  className="border-gray-300 focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  disabled={isDeleting}
                />
                
                {!isConfirmEnabled && confirmText.length > 0 && (
                  <p className="text-xs text-amber-600">
                    Text doesn't match. Please type exactly "{confirmationText}".
                  </p>
                )}
              </div>
              
              {error && (
                <div className="text-sm text-red-600 p-3 bg-red-50 border border-red-100 rounded">
                  {error}
                </div>
              )}
            </div>
          </div>
        )}
        
        <DialogFooter className="p-6 pt-2 border-t border-gray-100 gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isDeleting}
            className="border-gray-300 text-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            disabled={!isConfirmEnabled || isDeleting}
            className="bg-blue-600 hover:bg-blue-700 text-white"
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
