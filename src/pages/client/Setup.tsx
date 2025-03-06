import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ClientSetup = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const navigate = useNavigate();
  const { logClientActivity } = useClientActivity();

  useEffect(() => {
    const checkSetup = async () => {
      setIsLoading(true);
      try {
        const { data: user } = await supabase.auth.getUser();
        if (!user?.user?.id) {
          navigate("/auth");
          return;
        }

        // Check if the user has a client ID in their user metadata
        const clientId = user.user.user_metadata?.client_id;
        if (!clientId) {
          console.error("No client ID found in user metadata");
          toast.error("Client ID not found. Please contact support.");
          return;
        }

        // Check if the client has already completed the setup
        const { data: clientData, error: clientError } = await supabase
          .from("clients")
          .select("status")
          .eq("id", clientId)
          .single();

        if (clientError) {
          console.error("Error fetching client data:", clientError);
          toast.error("Failed to load client data. Please contact support.");
          return;
        }

        if (clientData?.status === "active") {
          setSetupComplete(true);
          navigate("/client/view");
        }
      } catch (error) {
        console.error("Error during setup check:", error);
        toast.error("An unexpected error occurred. Please contact support.");
      } finally {
        setIsLoading(false);
      }
    };

    checkSetup();
  }, [navigate]);

  const handleCompleteSetup = async () => {
    setIsLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user?.id) {
        navigate("/auth");
        return;
      }

      const clientId = user.user.user_metadata?.client_id;
      if (!clientId) {
        console.error("No client ID found in user metadata");
        toast.error("Client ID not found. Please contact support.");
        return;
      }

      // Update the client status to 'active'
      const { error: updateError } = await supabase
        .from("clients")
        .update({ status: "active" })
        .eq("id", clientId);

      if (updateError) {
        console.error("Error updating client status:", updateError);
        toast.error("Failed to complete setup. Please contact support.");
        return;
      }

      // Log client activity
      try {
        await logClientActivity("client_setup_completed", "completed the initial setup");
      } catch (logError) {
        console.error("Error logging activity:", logError);
      }

      setSetupComplete(true);
      navigate("/client/view");
      toast.success("Setup complete! Redirecting to your dashboard.");
    } catch (error) {
      console.error("Error completing setup:", error);
      toast.error("An unexpected error occurred. Please contact support.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Checking setup status...</p>
      </div>
    );
  }

  if (setupComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-500">Redirecting to your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Welcome to Welcome.Chat!
        </h1>
        <p className="text-gray-700 mb-6">
          Thank you for signing up. Please complete the setup to access your
          dashboard.
        </p>
        <button
          onClick={handleCompleteSetup}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2 font-medium transition-colors w-full"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Complete Setup
        </button>
      </div>
    </div>
  );
};

export default ClientSetup;
