
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendClientInvitation } from "@/utils/clientInvitationUtils";

interface SendClientInvitationProps {
  clientId: string;
  clientName: string;
  email: string;
  invitationSent: boolean;
  onInvitationSent: () => void;
}

export function SendClientInvitation({
  clientId,
  clientName,
  email,
  invitationSent,
  onInvitationSent
}: SendClientInvitationProps) {
  const [isSending, setIsSending] = useState(false);

  const handleSendInvitation = async () => {
    try {
      setIsSending(true);
      toast.loading(`Sending invitation to ${email}...`);
      
      const result = await sendClientInvitation(clientId, clientName, email);
      
      if (result.success) {
        toast.success(`Invitation sent successfully to ${email}`);
        onInvitationSent();
      } else {
        toast.error(`Failed to send invitation: ${result.error}`);
      }
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast.error("Failed to send invitation");
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="bg-gray-50 rounded-lg p-4 mb-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="font-medium text-gray-900">Client Invitation</h3>
          <p className="text-sm text-gray-500">
            {invitationSent 
              ? `Login credentials have been sent to ${email}`
              : `Send login credentials to ${email}`}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant={invitationSent ? "default" : "secondary"}
            className={`
              ${invitationSent 
                ? "bg-green-100 text-green-800 hover:bg-green-100" 
                : "bg-amber-100 text-amber-800 hover:bg-amber-100"}
            `}
          >
            {invitationSent ? "Invitation Sent" : "Pending Invitation"}
          </Badge>
          
          {!invitationSent && (
            <Button 
              onClick={handleSendInvitation} 
              disabled={isSending}
              size="sm"
              className="flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          )}
          
          {invitationSent && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-green-600 flex items-center gap-2" 
              disabled
            >
              <Check className="h-4 w-4" />
              Sent
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
