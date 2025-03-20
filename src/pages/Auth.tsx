
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LoginForm } from "@/components/auth/LoginForm";
import { SignupForm } from "@/components/auth/SignupForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/common/Logo";
import { getDashboardRoute } from "@/utils/authUtils";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const { isLoading, session, userRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if this is a password reset link
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    if (token) {
      setResetToken(token);
      setMode("reset");
    }
  }, [location]);

  useEffect(() => {
    // Redirect if already authenticated
    if (session && userRole && !isLoading) {
      const dashboardPath = getDashboardRoute(userRole);
      navigate(dashboardPath);
    }
  }, [session, navigate, userRole, isLoading]);

  // Handle if a reset token is not provided but mode is reset
  useEffect(() => {
    if (mode === "reset" && !resetToken) {
      setMode("login");
    }
  }, [mode, resetToken]);

  // If the user is already authenticated, don't render the auth forms
  if (session && userRole !== "user") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo className="w-32 h-auto" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === "login" && "Sign in to your account"}
          {mode === "signup" && "Create a new account"}
          {mode === "reset" && "Reset your password"}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {mode === "login" && (
            <LoginForm onSignUp={() => setMode("signup")} />
          )}
          {mode === "signup" && (
            <SignupForm onSignIn={() => setMode("login")} />
          )}
          {mode === "reset" && resetToken && (
            <ResetPasswordForm token={resetToken} onComplete={() => setMode("login")} />
          )}
        </div>
      </div>
    </div>
  );
}
