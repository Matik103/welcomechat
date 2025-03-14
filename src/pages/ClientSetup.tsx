
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PasswordForm } from "@/components/client-setup/PasswordForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface TokenData {
  isValid: boolean;
  email: string;
  clientId: string;
}

export default function ClientSetup() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(true);
  const [tokenData, setTokenData] = useState<TokenData>({
    isValid: false,
    email: "",
    clientId: ""
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Check if token exists and is valid
        const { data: invitation, error } = await supabase
          .from("client_invitations")
          .select("*, clients(*)")
          .eq("token", token)
          .eq("status", "pending")
          .single();

        if (error || !invitation) {
          console.error("Error verifying token:", error);
          setTokenData({
            isValid: false,
            email: "",
            clientId: ""
          });
          return;
        }

        // Check if token is expired (24 hours)
        const expiresAt = new Date(invitation.expires_at);
        const now = new Date();
        if (now > expiresAt) {
          setTokenData({
            isValid: false,
            email: "",
            clientId: ""
          });
          return;
        }

        setTokenData({
          isValid: true,
          email: invitation.email,
          clientId: invitation.client_id
        });
      } catch (error) {
        console.error("Error in token verification:", error);
        setTokenData({
          isValid: false,
          email: "",
          clientId: ""
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardHeader>
          <CardTitle>Invalid Request</CardTitle>
          <CardDescription>No invitation token provided.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!tokenData.isValid) {
    return (
      <Card className="mx-auto max-w-md mt-8">
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>
            This invitation link is invalid or has expired. Please contact your administrator for a new invitation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md mt-8">
      <CardHeader>
        <CardTitle>Welcome to WelcomeChat</CardTitle>
        <CardDescription>
          Please set up your password to complete your account creation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PasswordForm tokenData={tokenData} token={token} />
      </CardContent>
    </Card>
  );
}
