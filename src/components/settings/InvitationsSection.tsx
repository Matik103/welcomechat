
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Users, Mail } from "lucide-react";
import { useInvitations } from "@/hooks/useInvitations";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const InvitationsSection = () => {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const { createInvitation, isAdmin } = useInvitations();

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
      </CardContent>
    </Card>
  );
};
