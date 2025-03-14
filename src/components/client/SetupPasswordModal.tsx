import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SetupPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupPasswordModal({ isOpen, onClose }: SetupPasswordModalProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

      // Update the user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
        data: {
          needs_password_setup: false
        }
      });

      if (updateError) throw updateError;

      // Mark temporary password as used
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { error: tempPassError } = await supabase
          .from("client_temp_passwords")
          .update({ used: true })
          .eq("email", userData.user.email);

        if (tempPassError) {
          console.error("Error marking temp password as used:", tempPassError);
          // Continue anyway since password was updated
        }
      }

      toast.success("Password set successfully!");
      onClose();
    } catch (error: any) {
      console.error("Error setting password:", error);
      toast.error(error.message || "Failed to set password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Up Your Password</DialogTitle>
          <DialogDescription>
            Please set up a password for your account to ensure secure access.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Set Password
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
} 