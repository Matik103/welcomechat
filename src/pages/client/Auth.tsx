import { useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAppUrls } from "@/config/urls";

const ClientAuth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { session, userRole } = useAuth();

  if (session) {
    console.log("Client Auth - Session found");
    console.log("User metadata:", session.user.user_metadata);
    console.log("App metadata:", session.user.app_metadata);
    console.log("User role:", userRole);

    // Check all possible ways to identify a client
    const isClient = 
      session.user.user_metadata?.is_client || 
      session.user.app_metadata?.is_client || 
      userRole === 'client';

    if (isClient) {
      console.log("Client user confirmed, handling redirect");
      const urls = getAppUrls();
      
      // Force redirect to client dashboard in production
      if (import.meta.env.PROD) {
        console.log("Production environment detected, redirecting to:", urls.clientDashboard);
        window.location.href = urls.clientDashboard;
        return null;
      }
      
      // In development, use internal navigation
      console.log("Development environment detected, using internal navigation");
      return <Navigate to="/client/dashboard" replace />;
    }
    
    console.log("Non-client user detected, redirecting to main auth");
    const urls = getAppUrls();
    if (import.meta.env.PROD) {
      window.location.href = urls.auth;
      return null;
    }
    return <Navigate to="/auth" replace />;
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Attempting client login with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      console.log("Login successful, user data:", data.user);
      console.log("User metadata:", data.user?.user_metadata);
      console.log("App metadata:", data.user?.app_metadata);
      
      // The redirect will be handled by the session check above
      toast.success("Successfully signed in!");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Sign in to your account
          </CardTitle>
          <CardDescription>
            Enter your credentials to access your AI agent dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  placeholder="m@example.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAuth;
