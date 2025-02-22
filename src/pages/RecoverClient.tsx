
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RecoverClient = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);
  const token = searchParams.get("token");

  useEffect(() => {
    const recoverClient = async () => {
      if (!token) {
        toast.error("Invalid recovery link");
        navigate("/");
        return;
      }

      try {
        // First get the client_id from your edge function
        const { data: recoveryData, error: recoveryError } = await supabase.functions.invoke(
          "verify-recovery-token",
          {
            body: { token }
          }
        );

        if (recoveryError || !recoveryData) {
          throw new Error(recoveryError || "Invalid recovery token");
        }

        const { clientId, clientName, email } = recoveryData;

        // Recover the client
        const { error: updateError } = await supabase
          .from("clients")
          .update({
            deletion_scheduled_at: null,
            deleted_at: null,
          } as any)
          .eq("id", clientId);

        if (updateError) throw updateError;

        // Send confirmation email
        const { error: emailError } = await supabase.functions.invoke(
          "send-recovery-confirmation",
          {
            body: {
              clientName,
              email,
            },
          }
        );

        if (emailError) throw emailError;

        toast.success("Client account recovered successfully");
        navigate("/clients");
      } catch (error: any) {
        toast.error(`Error recovering client: ${error.message}`);
        navigate("/");
      } finally {
        setIsProcessing(false);
      }
    };

    recoverClient();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-sm max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isProcessing ? "Recovering Account..." : "Account Recovery"}
        </h1>
        <p className="text-gray-500">
          {isProcessing
            ? "Please wait while we process your recovery request."
            : "You will be redirected shortly."}
        </p>
      </div>
    </div>
  );
};

export default RecoverClient;
