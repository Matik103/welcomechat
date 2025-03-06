
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useClientActivity } from "@/hooks/useClientActivity";

export const SignOutSection = () => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { logClientActivity } = useClientActivity(user?.user_metadata?.client_id);

  const handleSignOut = async () => {
    try {
      // Log the sign out action before actually signing out
      if (user?.user_metadata?.client_id) {
        try {
          await logClientActivity("client_updated", "signed out of their account", {
            action_type: "signed_out"
          });
        } catch (error) {
          console.error("Failed to log signout activity:", error);
          // Continue with sign out even if logging fails
        }
      }
      
      await signOut();
      toast.success("Successfully signed out");
      navigate("/auth");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast.error(error.message || "Failed to sign out");
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
        <Button variant="destructive" onClick={handleSignOut}>
          Sign Out
        </Button>
      </CardContent>
    </Card>
  );
};
