
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
  clientEmail: string;
  onDeleted: () => void;
}

export function DeleteClientDialog({
  isOpen,
  onClose,
  clientName,
  clientId,
  clientEmail,
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
      // Set deletion_scheduled_at to 30 days from now
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      const { error: updateError } = await supabase
        .from("clients")
        .update({
          deleted_at: null,
          deletion_scheduled_at: deletionDate.toISOString(),
        })
        .eq("id", clientId);

      if (updateError) throw updateError;

      // Send deletion notification email
      const { error: emailError } = await supabase.functions.invoke(
        "send-deletion-email",
        {
          body: {
            clientId,
            clientName,
            email: clientEmail,
          },
        }
      );

      if (emailError) {
        // Revert the deletion if email fails
        await supabase
          .from("clients")
          .update({
            deletion_scheduled_at: null,
          })
          .eq("id", clientId);
        throw emailError;
      }

      toast.success("Client scheduled for deletion and notification email sent");
      onDeleted();
      onClose();
    } catch (error: any) {
      console.error("Error scheduling client deletion:", error);
      toast.error(`Error scheduling client deletion: ${error.message}`);
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
              This action will schedule the client for deletion in 30 days. 
              The client will receive an email with instructions to recover their account if needed.
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
            {isDeleting ? "Processing..." : "Schedule Deletion"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
