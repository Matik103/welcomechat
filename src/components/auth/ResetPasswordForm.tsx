
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const requestResetSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

const resetPasswordSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

interface ResetPasswordFormProps {
  token?: string;
  onSuccess?: () => void;
}

export default function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Use the appropriate schema based on whether we have a token
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(token ? resetPasswordSchema : requestResetSchema),
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      if (token) {
        // Reset the password with the token
        const { error } = await supabase.auth.updateUser({
          password: data.password
        });

        if (error) throw error;
        toast.success("Password reset successfully. You can now log in with your new password.");
      } else {
        // Request a password reset
        const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;
        toast.success("If your email exists in our system, you will receive password reset instructions.");
      }
      
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to process password reset");
    } finally {
      setIsLoading(false);
    }
  };

  // Request password reset form
  if (!token) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            type="email"
            placeholder="Email"
            {...register("email")}
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{String(errors.email.message)}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending reset link...
            </>
          ) : (
            "Request Password Reset"
          )}
        </Button>
      </form>
    );
  }

  // Reset password form (with token)
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          type="password"
          placeholder="New Password"
          {...register("password")}
          className={errors.password ? "border-red-500" : ""}
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{String(errors.password.message)}</p>}
      </div>

      <div>
        <Input
          type="password"
          placeholder="Confirm New Password"
          {...register("confirmPassword")}
          className={errors.confirmPassword ? "border-red-500" : ""}
        />
        {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{String(errors.confirmPassword.message)}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Resetting password...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>
    </form>
  );
}
