import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

export default function ClientSetup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const setupAccount = async () => {
      if (!token) {
        toast.error("No verification token provided");
        navigate("/");
        return;
      }

      try {
        // Check if token exists and is not expired
        const { data: invitation, error } = await supabase
          .from("client_invitations")
          .select("*")
          .eq("token", token)
          .eq("status", "pending")
          .gte("expires_at", new Date().toISOString())
          .maybeSingle();

        if (error) throw error;

        if (!invitation) {
          toast.error("Invalid or expired verification link");
          navigate("/");
          return;
        }

        // Generate a temporary password
        const tempPassword = uuidv4();

        // Create user account
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: invitation.email,
          password: tempPassword,
          options: {
            data: {
              client_id: invitation.client_id,
              needs_password_setup: true
            }
          }
        });

        if (signUpError) throw signUpError;

        // Update invitation status
        const { error: updateError } = await supabase
          .from("client_invitations")
          .update({ 
            status: "accepted", 
            accepted_at: new Date().toISOString() 
          })
          .eq("token", token);

        if (updateError) throw updateError;

        // Create user role for the client
        const { error: roleError } = await supabase.from("user_roles").insert({
          user_id: signUpData.user!.id,
          role: "client"
        });

        if (roleError) throw roleError;

        // Log the activity
        await supabase.from("client_activities").insert({
          client_id: invitation.client_id,
          activity_type: "account_setup",
          description: "completed account setup",
          metadata: {
            setup_method: "auto_setup"
          }
        });

        // Sign in with the temporary credentials
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: invitation.email,
          password: tempPassword
        });

        if (signInError) throw signInError;

        // Store temporary password for later use
        const { error: tempPassError } = await supabase.from("client_temp_passwords").insert({
          client_id: invitation.client_id,
          email: invitation.email,
          temp_password: tempPassword,
          used: false
        });

        if (tempPassError) throw tempPassError;

        toast.success("Account created successfully! Redirecting to dashboard...");
        navigate("/client/dashboard");
      } catch (error: any) {
        console.error("Error setting up account:", error);
        toast.error(error.message || "Failed to set up your account");
        navigate("/");
      } finally {
        setIsLoading(false);
      }
    };

    setupAccount();
  }, [token, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return null;
} 