
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
import { sendEmail } from '@/utils/emailUtils';

interface DeleteClientDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  onClientsUpdated: () => void;
}

export const DeleteClientDialog = ({
  isOpen,
  onOpenChange,
  client,
  onClientsUpdated
}: DeleteClientDialogProps) => {
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
      
      // Set the deletion_scheduled_at timestamp
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { data, error: updateError } = await supabase
        .from('ai_agents')
        .update({ 
          deletion_scheduled_at: new Date().toISOString(),
          status: 'inactive'
        })
        .eq('id', client.id);
      
      if (updateError) {
        console.error("Error scheduling client deletion:", updateError);
        throw updateError;
      }
      
      // Send notification email to client
      const emailResult = await sendEmail({
        to: client.email,
        subject: "Your account is scheduled for deletion",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h1 style="color: #333;">Account Deletion Scheduled</h1>
            <p>Hello ${client.client_name},</p>
            <p>Your account has been scheduled for deletion. If you did not request this action, or wish to keep your account, you can easily reactivate it by signing in within the next 30 days.</p>
            <p>After 30 days, your account and all associated data will be permanently deleted.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${window.location.origin}/client/auth" 
                 style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Sign In to Reactivate
              </a>
            </div>
            <p>If you have any questions or need assistance, please contact our support team.</p>
            <p>Thank you for using our service.</p>
          </div>
        `
      });
      
      if (!emailResult.success) {
        console.error("Error sending deletion notification email:", emailResult.error);
        // Continue with deletion process even if email fails
      }
      
      // Log the activity
      const { error: activityError } = await supabase
        .from('activities')
        .insert({
          ai_agent_id: client.id,
          type: 'client_deletion_scheduled',
          metadata: {
            client_name: client.client_name,
            email: client.email,
            scheduled_at: new Date().toISOString(),
            permanent_deletion_date: thirtyDaysFromNow.toISOString()
          }
        });
      
      if (activityError) {
        console.error("Error creating activity record:", activityError);
        // Continue with the process even if activity logging fails
      }
      
      // Refresh the client list
      onClientsUpdated();
      
      // Close the dialog
      toast.success(`${client.client_name} has been scheduled for deletion`);
      handleClose();
      
    } catch (err) {
      console.error("Error during client deletion:", err);
      setError(`Failed to schedule deletion: ${err instanceof Error ? err.message : String(err)}`);
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
            This will schedule the client account for deletion. The client will have 30 days to reactivate by signing in.
          </DialogDescription>
        </DialogHeader>

        {client && (
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                <p className="font-medium">Warning:</p>
                <p>After 30 days, this will permanently delete:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Client account for {client.client_name}</li>
                  <li>All associated website URLs and content</li>
                  <li>All document links and content</li>
                  <li>Chat history and interactions</li>
                  <li>All client settings</li>
                </ul>
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
                Processing...
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

export default DeleteClientDialog;
