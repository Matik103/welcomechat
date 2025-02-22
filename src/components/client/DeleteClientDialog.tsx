
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DeleteClientDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  clientId: string;
  onDeleted: () => void;
}

export function DeleteClientDialog({
  isOpen,
  onClose,
  clientName,
  clientId,
  onDeleted,
}: DeleteClientDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const expectedConfirmation = `delete ${clientName.toLowerCase()}`;

  const handleDelete = async () => {
    if (confirmation.toLowerCase() !== expectedConfirmation) {
      toast.error("Confirmation text doesn't match");
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (error) throw error;

      toast.success("Client deleted successfully");
      onDeleted();
      onClose();
    } catch (error: any) {
      toast.error(`Error deleting client: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Client</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              This action cannot be undone. This will permanently delete the client
              and all associated data.
            </p>
            <p>
              Please type <strong>delete {clientName.toLowerCase()}</strong> to
              confirm.
            </p>
            <Input
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder={`delete ${clientName.toLowerCase()}`}
              autoFocus
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={
              confirmation.toLowerCase() !== expectedConfirmation || isDeleting
            }
          >
            {isDeleting ? "Deleting..." : "Delete Client"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
