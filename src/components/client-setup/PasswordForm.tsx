
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { TokenData } from "@/hooks/useSetupToken";

interface PasswordFormProps {
  tokenData: TokenData;
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
      toast.error("Invalid invitation");
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

      // Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: tokenData.email,
        password: password,
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

      toast.success("Account created successfully! Redirecting to dashboard...");
      
      // Allow time for toast to be seen then redirect to client dashboard
      setTimeout(() => {
        navigate("/client/view");
      }, 2000);
    } catch (error: any) {
      console.error("Error setting up account:", error);
      toast.error(error.message || "Failed to set up your account");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={tokenData.email} disabled />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Create Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Setting up...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  );
};
