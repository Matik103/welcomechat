
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecoveryToken {
  id: string;
  client_id: string;
  token: string;
  expires_at: string;
  created_at: string;
  used_at: string | null;
  clients: {
    id: string;
    client_name: string;
    email: string;
  };
}

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
        // Get recovery token info
        const { data: tokenData, error: tokenError } = await supabase
          .from("client_recovery_tokens")
          .select(`
            *,
            clients (
              id,
              client_name,
              email
            )
          `)
          .eq("token", token)
          .single() as { data: RecoveryToken | null; error: any };

        if (tokenError) throw tokenError;
        if (!tokenData) throw new Error("Recovery token not found");

        if (tokenData.used_at) {
          toast.error("This recovery link has already been used");
          navigate("/");
          return;
        }

        if (new Date(tokenData.expires_at) < new Date()) {
          toast.error("This recovery link has expired");
          navigate("/");
          return;
        }

        // Recover the client
        const { error: updateError } = await supabase
          .from("clients")
          .update({
            deletion_scheduled_at: null,
            deleted_at: null,
          } as any) // Using 'as any' temporarily until types are regenerated
          .eq("id", tokenData.client_id);

        if (updateError) throw updateError;

        // Mark token as used
        await supabase
          .from("client_recovery_tokens")
          .update({ used_at: new Date().toISOString() } as any)
          .eq("id", tokenData.id);

        // Send confirmation email
        await supabase.functions.invoke("send-recovery-confirmation", {
          body: {
            clientName: tokenData.clients.client_name,
            email: tokenData.clients.email,
          },
        });

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
