
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

      // Update the ai_agents table only
      const { error } = await supabase
        .from("ai_agents")
        .update({
          status: "deleted" as ClientStatus, // Change to "deleted" so it's immediately removed from the list
          deletion_scheduled_at: deletionDate.toISOString(),
        })
        .eq("id", client.id);

      if (error) {
        throw error;
      }

      // Send deletion notification email - only after successful database update
      setIsSendingEmail(true);
      const toastId = toast.loading("Sending notification email...");
      
      try {
        // Call the edge function directly - no redundant client-side wrappers
        const { data, error: emailError } = await supabase.functions.invoke('send-deletion-email', {
          body: {
            clientId: client.id,
            clientName: client.client_name,
            email: client.email,
            agentName: client.agent_name
          }
        });

        toast.dismiss(toastId);
        
        if (emailError) {
          console.error("Email sending error:", emailError);
          
          // Log the failed email attempt
          await createClientActivity(
            client.id,
            "system_update",
            `Failed to send deletion email to client ${client.client_name}`,
            { 
              error: emailError.message,
              action: "deletion_email_failed",
              client_name: client.client_name,
              admin_action: true
            }
          );
          
          toast.error(`Client scheduled for deletion but failed to send notification email: ${emailError.message}`, {
            duration: 6000
          });
        } else if (data && !data.success) {
          console.error("Email function returned error:", data);
          
          toast.error(`Client scheduled for deletion but failed to send notification email: ${data.error || "Unknown error"}`, {
            duration: 6000
          });
        } else {
          // Success - log the activity
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
          
          toast.success(`Client scheduled for deletion and notification email sent to ${client.email}`);
        }
      } catch (emailErr: any) {
        toast.dismiss(toastId);
        console.error("Error sending email:", emailErr);
        toast.error(`Client scheduled for deletion but failed to send notification email: ${emailErr.message || "Unknown error"}`, {
          duration: 6000
        });
      } finally {
        setIsSendingEmail(false);
      }
      
      // Let the parent component know to update the list
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
