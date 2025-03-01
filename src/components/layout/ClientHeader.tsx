
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CogIcon, LifeBuoy, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const ClientHeader = () => {
  const { user, signOut } = useAuth();
  const [clientName, setClientName] = useState<string | null>(null);
  const location = useLocation();
  const isDashboard = location.pathname === "/client/view";

  useEffect(() => {
    const fetchClientName = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from("clients")
          .select("client_name")
          .eq("email", user.email)
          .maybeSingle();
          
        if (!error && data) {
          setClientName(data.client_name);
        }
      } catch (error) {
        console.error("Error fetching client name:", error);
      }
    };
    
    fetchClientName();
  }, [user]);

  return (
    <header className="border-b bg-white sticky top-0 z-10">
      <div className="container flex h-16 items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Link to="/client/view" className="flex items-center gap-2">
            <span className="text-xl font-bold">
              {isDashboard ? "AI Agent Dashboard" : clientName || "Client Portal"}
            </span>
          </Link>
        </div>

        <nav className="flex items-center gap-4">
          <Link to="/client/edit">
            <Button variant="ghost" size="sm">
              Edit Profile
            </Button>
          </Link>
          <Link to="/client/settings">
            <Button variant="ghost" size="sm" className="gap-1 items-center">
              <CogIcon className="w-4 h-4" />
              Settings
            </Button>
          </Link>
          <Link to="/client/widget-settings">
            <Button variant="ghost" size="sm" className="gap-1 items-center">
              <LifeBuoy className="w-4 h-4" />
              Widget Settings
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="gap-1 items-center"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </nav>
      </div>
    </header>
  );
}
