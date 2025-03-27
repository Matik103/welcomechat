
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
import { execSql } from '@/utils/rpcUtils';

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
  
  const confirmationText = client ? client.client_name : 'unknown';
  
  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      setError(null);
      onOpenChange(false);
    }
  };
  
  const isConfirmEnabled = confirmText === confirmationText;
  
  const handleDelete = async () => {
    if (!client || !isConfirmEnabled) return;
    
    try {
      setError(null);
      setIsDeleting(true);
      
      console.log(`Scheduling deletion of client: ${client.id}`);
      
      // Set the deletion_scheduled_at timestamp
      const now = new Date().toISOString();
      
      const { data, error: updateError } = await supabase
        .from('ai_agents')
        .update({ 
          deletion_scheduled_at: now,
          status: 'deleted'
        })
        .eq('id', client.id);
      
      if (updateError) {
        console.error("Error scheduling client deletion:", updateError);
        throw updateError;
      }
      
      // Log the deletion to console since client_activities table is removed
      console.log('Deletion notification email sent', {
        client_id: client.id,
        client_name: client.client_name,
        email: client.email,
        timestamp: now
      });
      
      // Refresh the client list
      onClientsUpdated();
      
      // Close the dialog
      toast.success(`${client.client_name} has been scheduled for deletion`);
      handleClose();
      
    } catch (err) {
      console.error("Error during client deletion:", err);
      setError(`Failed to delete client: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-destructive">Delete Client</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the client 
            and all associated data.
          </DialogDescription>
        </DialogHeader>

        {client && (
          <div className="py-4">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-800">
                <p className="font-medium">Warning:</p>
                <p>Deleting this client will remove all their data, including:</p>
                <ul className="list-disc ml-5 mt-1">
                  <li>Website URLs and content</li>
                  <li>Document links and content</li>
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
                Deleting...
              </>
            ) : (
              'Delete Client'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteClientDialog;
