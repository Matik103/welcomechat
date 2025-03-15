
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { createUserRole } from "@/utils/authUtils";

export const AdminSetup = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const setupAdmin = async () => {
    if (!user) {
      toast.error("You must be logged in to set up admin");
      return;
    }

    try {
      setIsLoading(true);
      const success = await createUserRole(user.id, 'admin');

      if (!success) throw new Error("Failed to create admin role");
      
      toast.success("Admin role set up successfully");
      // Reload the page to refresh permissions
      window.location.reload();
    } catch (error: any) {
      console.error('Error setting up admin:', error);
      toast.error(error.message || "Failed to set up admin role");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Setup</CardTitle>
        <CardDescription>
          First-time setup: Create an admin role for your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={setupAdmin} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Setting up...
            </>
          ) : (
            "Set up admin role"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
