
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PasswordFormProps {
  tokenData: {
    isValid: boolean;
    email: string;
    clientId: string;
  };
  token: string;
}

export const PasswordForm = ({ tokenData, token }: PasswordFormProps) => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tokenData.isValid) {
      toast.error("Invalid or expired invitation");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Starting account setup for:", tokenData.email);

      // Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: tokenData.email,
        password: password,
        options: {
          data: {
            client_id: tokenData.clientId
          }
        }
      });

      if (signUpError) {
        console.error("Sign up error:", signUpError);
        throw signUpError;
      }

      console.log("User account created successfully");

      // Update invitation record by marking it as used
      // We'll update the expires_at field to now (making it expired)
      console.log("Updating invitation record for token:", token);
      const { error: updateError } = await supabase
        .from("client_invitations")
        .update({ 
          expires_at: new Date().toISOString() // This effectively marks it as used
        })
        .eq("token", token);

      if (updateError) {
        console.error("Error updating invitation record:", updateError);
        throw updateError;
      }

      console.log("Invitation record marked as used");

      // Create user role for the client
      console.log("Creating user role for client ID:", tokenData.clientId);
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: signUpData.user!.id,
          role: "client",
          client_id: tokenData.clientId
        });

      if (roleError) {
        console.error("Error creating user role:", roleError);
        throw roleError;
      }

      console.log("User role created successfully");

      // Log the setup completion - using a valid activity_type
      const { error: activityError } = await supabase
        .from("client_activities")
        .insert({
          client_id: tokenData.clientId,
          activity_type: "ai_agent_created",
          description: "completed account setup",
          metadata: {
            setup_method: "invitation"
          }
        });

      if (activityError) {
        console.error("Failed to log activity:", activityError);
        // Don't throw, as the setup was successful
      } else {
        console.log("Setup completion activity logged successfully");
      }

      toast.success("Account set up successfully! Redirecting to your dashboard...");
      
      // Allow time for toast to be seen then redirect to client dashboard
      setTimeout(() => {
        navigate("/client/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("Error setting up account:", error);
      toast.error(error.message || "Failed to set up your account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="password">Create Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          minLength={6}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm your password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Set Up Account
      </Button>
    </form>
  );
};
