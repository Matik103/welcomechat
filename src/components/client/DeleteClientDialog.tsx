
import React, { useState } from 'react';
import { 
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { createActivityDirect } from '@/services/clientActivityService';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function DeleteClientDialog({ open, onOpenChange, clientId, clientName }: DeleteClientDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const handleDelete = async () => {
    if (!clientId) return;
    
    setIsDeleting(true);
    
    try {
      // Log the deletion activity
      await createActivityDirect(
        clientId,
        'client_deleted',
        `Client "${clientName}" deleted`,
        { client_name: clientName }
      );
      
      // Delete the client
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);
      
      if (error) throw error;
      
      toast.success(`Client "${clientName}" deleted successfully`);
      onOpenChange(false);
      navigate('/admin/clients');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this client?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the client
            "{clientName}" and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
