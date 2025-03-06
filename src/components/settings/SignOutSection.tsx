
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useClientActivity } from "@/hooks/useClientActivity";
import { checkAndRefreshAuth } from "@/services/authService";

export const SignOutSection = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { logClientActivity } = useClientActivity(user?.user_metadata?.client_id);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      console.log("Signing out user:", user?.email);
      
      // Check and refresh auth session if needed
      const isAuthValid = await checkAndRefreshAuth();
      if (!isAuthValid) {
        // If auth is already invalid, just redirect to auth page
        navigate("/auth", { replace: true });
        return;
      }
      
      // Log the sign out action before actually signing out
      if (user?.user_metadata?.client_id) {
        try {
          await logClientActivity("signed_out", "signed out of their account");
        } catch (logError) {
          console.error("Failed to log sign out activity, continuing with sign out", logError);
          // Continue with sign out even if logging fails
        }
      }
      
      // Explicitly call the signOut function from AuthContext
      await signOut();
      console.log("Sign out successful");
      toast.success("Successfully signed out");
      navigate("/auth", { replace: true });
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
      
      // If sign out fails due to a network error, force a client-side sign out
      if (error.message?.includes("Failed to fetch") || error.message?.includes("Network Error")) {
        console.log("Forcing client-side sign out due to network error");
        navigate("/auth", { replace: true });
        window.location.reload(); // Force a full page reload to clear auth state
      }
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
