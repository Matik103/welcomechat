
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useClientActivity } from "@/hooks/useClientActivity";

export const SignOutSection = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { logClientActivity } = useClientActivity(user?.user_metadata?.client_id);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      console.log("Signing out user:", user?.email);
      
      // Log the sign out action before actually signing out
      if (user?.user_metadata?.client_id) {
        await logClientActivity("signed_out", "signed out of their account");
      }
      
      // Explicitly call the signOut function from AuthContext
      await signOut();
      console.log("Sign out successful");
      toast.success("Successfully signed out");
      navigate("/auth");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <LogOut className="h-5 w-5" />
          Sign Out
        </CardTitle>
        <CardDescription>
          Sign out of your account on this device
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" onClick={handleSignOut} disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};
