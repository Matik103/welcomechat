
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
        await logClientActivity("signed_out", "signed out of their account");
      }
      
      await signOut();
      toast.success("Successfully signed out");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message);
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
