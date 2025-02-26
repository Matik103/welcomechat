
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Mail, Ban, RefreshCw } from "lucide-react";
import { useInvitations } from "@/hooks/useInvitations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export const InvitationsSection = () => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const { createInvitation, cancelInvitation, invitations, isLoading, isAdmin } = useInvitations();

  const handleInvite = async (role: 'client' | 'admin') => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setInviteLoading(true);
      
      // First create the invitation
      const invitation = await createInvitation.mutateAsync({
        email: inviteEmail,
        role_type: role
      });

      // Then send the invitation email
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: inviteEmail,
          role_type: role,
          url: `${window.location.origin}/auth?invitation=${invitation.token}`
        }
      });

      if (emailError) throw new Error(emailError.message);

      setInviteEmail("");
      toast.success("Invitation sent successfully");
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancel = async (invitationId: string) => {
    try {
      setCancellingId(invitationId);
      await cancelInvitation.mutateAsync(invitationId);
      toast.success("Invitation cancelled successfully");
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast.error(error.message || "Failed to cancel invitation");
    } finally {
      setCancellingId(null);
    }
  };

  const handleResend = async (invitation: any) => {
    try {
      setResendingId(invitation.id);
      const { error: emailError } = await supabase.functions.invoke('send-invitation', {
        body: {
          email: invitation.email,
          role_type: invitation.role_type,
          url: `${window.location.origin}/auth?invitation=${invitation.token}`
        }
      });

      if (emailError) throw new Error(emailError.message);
      toast.success("Invitation resent successfully");
    } catch (error: any) {
      console.error('Error resending invitation:', error);
      toast.error(error.message || "Failed to resend invitation");
    } finally {
      setResendingId(null);
    }
  };

  // Only render for admins
  if (!isAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invite Users
        </CardTitle>
        <CardDescription>
          Administrators can send invitations to new clients or administrators
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email Address</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="flex gap-4">
              <Button
                onClick={() => handleInvite('client')}
                disabled={inviteLoading}
                className="flex-1"
              >
                {inviteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Invite as Client
                  </>
                )}
              </Button>
              <Button
                onClick={() => handleInvite('admin')}
                disabled={inviteLoading}
                className="flex-1"
              >
                {inviteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Invite as Admin
                  </>
                )}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : invitations && invitations.length > 0 ? (
            <div className="space-y-4">
              <h3 className="font-medium">Sent Invitations</h3>
              <div className="space-y-4">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{invitation.email}</p>
                      <p className="text-sm text-muted-foreground">
                        {invitation.role_type} · Sent {format(new Date(invitation.created_at), 'PPp')}
                      </p>
                      <p className="text-sm font-medium capitalize text-muted-foreground">
                        Status: {invitation.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {invitation.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResend(invitation)}
                            disabled={resendingId === invitation.id}
                          >
                            {resendingId === invitation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancel(invitation.id)}
                            disabled={cancellingId === invitation.id}
                          >
                            {cancellingId === invitation.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Ban className="h-4 w-4" />
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No invitations sent yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
