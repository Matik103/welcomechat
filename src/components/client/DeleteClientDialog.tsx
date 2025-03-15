
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
      console.log("Scheduling deletion for client:", clientId);
      
      // Set deletion date for 30 days from now
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      // First update the client's deletion_scheduled_at in database
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          deletion_scheduled_at: deletionDate.toISOString(),
        })
        .eq("id", clientId);

      if (updateError) throw updateError;
      
      // Set up the email content
      const emailContent = `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1>Account Deletion Notice</h1>
            <p>Dear ${clientName},</p>
            <p>As requested, your account has been scheduled for deletion. The deletion will be completed in 30 days.</p>
            <p>If this was done in error, you can contact support to cancel the deletion process.</p>
            <p>Please note: After 30 days, all your data will be permanently deleted and cannot be recovered.</p>
            <p>Best regards,<br>AI Assistant Team</p>
          </body>
        </html>
      `;
      
      // Now attempt to send the deletion email
      try {
        console.log("Sending deletion email to:", clientEmail);
        const { data, error: emailError } = await supabase.functions.invoke("send-email", {
          body: {
            to: clientEmail,
            subject: "Account Deletion Notice",
            html: emailContent,
            from: "AI Assistant <admin@welcome.chat>"
          },
        });

        if (emailError || (data && data.error)) {
          console.error("Email error details:", emailError || data?.error);
          // Log the email error but don't throw - we've already updated the database
          toast.warning("Client scheduled for deletion but email notification failed to send");
        } else {
          toast.success("Client scheduled for deletion and notification email sent");
        }
      } catch (emailError) {
        console.error("Exception sending email:", emailError);
        toast.warning("Client scheduled for deletion but email notification failed to send");
      }
      
      // Even if email fails, we still successfully scheduled deletion
      onDeleted();
      onClose();
    } catch (error: any) {
      console.error("Error in deletion process:", error);
      toast.error(error.message || "Error processing deletion request");
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
