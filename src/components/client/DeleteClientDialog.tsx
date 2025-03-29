
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
import { scheduleClientDeletion } from '@/utils/clientUtils';

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
      
      // Use the scheduleClientDeletion function to handle the deletion
      const result = await scheduleClientDeletion(
        client.id,
        client.email,
        client.client_name
      );
      
      if (!result.success) {
        throw result.error || new Error("Failed to schedule client deletion");
      }
      
      // Refresh the client list
      onClientsUpdated();
      
      // Show success message with recovery token info if available
      toast.success(
        `${client.client_name} has been scheduled for deletion`,
        {
          description: "A recovery link has been sent to the client's email address."
        }
      );
      
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
