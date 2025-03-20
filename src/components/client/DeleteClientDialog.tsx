
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { ClientStatus } from "@/types/activity";

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
      await sendDeletionEmail(client);
      
      toast.success("Client scheduled for deletion");
      onClientsUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast.error(`Failed to delete client: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  const sendDeletionEmail = async (client: Client) => {
    if (!client.email || !client.client_name) {
      console.error("Missing client email or name for deletion notification");
      return;
    }

    setIsSendingEmail(true);
    try {
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
        toast.error("Failed to send deletion notification email");
      } else {
        console.log("Deletion email sent successfully:", data);
      }
    } catch (error) {
      console.error("Error invoking send-deletion-email function:", error);
      toast.error("Failed to send deletion notification email");
    } finally {
      setIsSendingEmail(false);
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
                Deleting...
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
