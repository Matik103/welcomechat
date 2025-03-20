
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ClientStatus } from "@/types/activity";
import { createClientActivity } from "@/services/clientActivityService";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const CONFIRMATION_TEXT = "schedule deletion";

  const handleDelete = async () => {
    if (!client) return;
    
    if (confirmText.toLowerCase() !== CONFIRMATION_TEXT) {
      toast.error("Please type 'schedule deletion' to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      // Log activity that deletion has been initiated
      await createClientActivity(
        client.id,
        "client_updated",
        `Client ${client.client_name} deletion initiated`,
        { 
          action: "deletion_started",
          client_name: client.client_name,
          admin_action: true
        }
      );

      // Schedule the client for deletion in 30 days
      const deletionDate = new Date();
      deletionDate.setDate(deletionDate.getDate() + 30);

      const { error } = await supabase
        .from("clients")
        .update({
          status: "deleted" as ClientStatus,
          deletion_scheduled_at: deletionDate.toISOString(),
        })
        .eq("id", client.id);

      if (error) {
        throw error;
      }

      // Send deletion notification email
      setIsSendingEmail(true);
      const toastId = toast.loading("Sending notification email...");
      
      try {
        const emailResult = await sendDeletionEmail(client);
        
        toast.dismiss(toastId);
        if (emailResult.success) {
          toast.success(`Client scheduled for deletion and notification email sent to ${client.email}`);
        } else {
          toast.error(`Client scheduled for deletion but failed to send notification email: ${emailResult.message || "Unknown error"}`);
          console.error("Email sending failed:", emailResult);
        }
      } catch (emailErr: any) {
        toast.dismiss(toastId);
        toast.error(`Failed to send notification email: ${emailErr.message || "Unknown error"}`);
        console.error("Email sending exception:", emailErr);
      } finally {
        setIsSendingEmail(false);
      }
      
      // Let the parent component know to update the list and log the activity
      onClientsUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting client:", error);
      
      // Log the failed deletion attempt
      await createClientActivity(
        client.id,
        "system_update",
        `Failed to schedule deletion for client ${client.client_name}`,
        { 
          error: error.message,
          action: "deletion_failed",
          client_name: client.client_name,
          admin_action: true
        }
      );
      
      toast.error(`Failed to delete client: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  const sendDeletionEmail = async (client: Client): Promise<{success: boolean, message?: string}> => {
    if (!client.email || !client.client_name) {
      console.error("Missing client email or name for deletion notification");
      
      // Log the failed email attempt
      await createClientActivity(
        client.id,
        "system_update",
        `Failed to send deletion email to client ${client.client_name}`,
        { 
          error: "Missing client email or name",
          action: "deletion_email_failed",
          client_name: client.client_name,
          admin_action: true
        }
      );
      
      return { success: false, message: "Missing client email or name" };
    }

    try {
      // Log that we're attempting to send the email
      await createClientActivity(
        client.id,
        "email_sent",
        `Sending deletion notification email to ${client.client_name}`,
        { 
          recipient_email: client.email,
          email_type: "deletion_notification",
          client_name: client.client_name,
          admin_action: true
        }
      );
      
      const { data, error } = await supabase.functions.invoke('send-deletion-email', {
        body: {
          clientId: client.id,
          clientName: client.client_name,
          email: client.email,
          agentName: client.agent_name
        }
      });

      if (error) {
        console.error("Error sending deletion email:", error);
        
        // Log the failed email
        await createClientActivity(
          client.id,
          "system_update",
          `Failed to send deletion email to client ${client.client_name}`,
          { 
            error: error.message,
            action: "deletion_email_failed",
            client_name: client.client_name,
            recipient_email: client.email,
            admin_action: true
          }
        );
        
        return { success: false, message: `Error: ${error.message}` };
      } else {
        console.log("Deletion email sent successfully:", data);
        
        // Log successful email
        await createClientActivity(
          client.id,
          "email_sent",
          `Deletion notification email sent to ${client.client_name}`,
          { 
            recipient_email: client.email,
            email_type: "deletion_notification",
            client_name: client.client_name,
            admin_action: true,
            successful: true
          }
        );
        
        return { success: true };
      }
    } catch (error: any) {
      console.error("Error invoking send-deletion-email function:", error);
      
      // Log the error
      await createClientActivity(
        client.id,
        "system_update",
        `Error sending deletion email to client ${client.client_name}`,
        { 
          error: String(error),
          action: "deletion_email_error",
          client_name: client.client_name,
          admin_action: true
        }
      );
      
      return { success: false, message: `Error: ${error.message || "Unknown error"}` };
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this client?</AlertDialogTitle>
          <AlertDialogDescription>
            This will schedule the client for deletion in 30 days. After this period, all client data
            including AI agents, chat history, and documents will be permanently removed.
            <br /><br />
            Client: <strong>{client?.client_name}</strong>
            <br />
            Email: <strong>{client?.email}</strong>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="my-4">
          <p className="text-sm font-medium mb-2">
            Please type <strong className="text-destructive">{CONFIRMATION_TEXT}</strong> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type confirmation text here"
            className="w-full"
          />
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setConfirmText("")}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting || confirmText.toLowerCase() !== CONFIRMATION_TEXT}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isSendingEmail ? "Sending email..." : "Deleting..."}
              </>
            ) : (
              "Delete Client"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
