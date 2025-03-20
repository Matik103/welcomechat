
import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { useAuth } from "@/contexts/AuthContext";
import Logo from "@/components/common/Logo";
import { UserRole } from "@/types/app";
import { getDashboardRoute } from "@/utils/authUtils";

type AuthMode = "login" | "signup" | "resetPassword";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, userRole, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check URL parameters to determine mode
    const modeParam = searchParams.get("mode");
    if (modeParam === "signup") setMode("signup");
    else if (modeParam === "resetPassword") setMode("resetPassword");
    else setMode("login");

    // Get reset token from URL if present
    const resetToken = searchParams.get("token");
    if (resetToken) setToken(resetToken);
  }, [searchParams]);

  useEffect(() => {
    // Redirect if already authenticated
    if (user && userRole && !isLoading) {
      const dashboardRoute = getDashboardRoute(userRole);
      navigate(dashboardRoute, { replace: true });
    }
  }, [user, userRole, isLoading, navigate]);

  const handleSuccess = () => {
    // Redirect or show success message as needed
    if (mode === "resetPassword") {
      setMode("login");
    }
  };

  const renderForm = () => {
    switch (mode) {
      case "signup":
        return <SignupForm onSuccess={handleSuccess} />;
      case "resetPassword":
        return <ResetPasswordForm token={token} onSuccess={handleSuccess} />;
      case "login":
      default:
        return <LoginForm onSuccess={handleSuccess} />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "login" && "Sign in to your account"}
            {mode === "signup" && "Create a new account"}
            {mode === "resetPassword" && "Reset your password"}
          </h2>
        </div>

        {renderForm()}

        <div className="mt-6 text-center">
          {mode === "login" && (
            <>
              <button
                type="button"
                onClick={() => setMode("resetPassword")}
                className="text-sm text-blue-600 hover:text-blue-800 mr-4"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Don't have an account? Sign up
              </button>
            </>
          )}
          {mode === "signup" && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Already have an account? Sign in
            </button>
          )}
          {mode === "resetPassword" && !token && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Back to sign in
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
