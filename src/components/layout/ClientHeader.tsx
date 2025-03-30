
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClientData } from "@/hooks/useClientData";

export const ClientHeader = () => {
  const { user, signOut } = useAuth();
  const { client } = useClientData(user?.user_metadata?.client_id);
  
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) return null;
  
  const clientName = client?.client_name || user.user_metadata?.full_name || user.email;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/client/dashboard">
              <img 
                src="/lovable-uploads/e262d378-49c1-4219-ae37-ce0264b3500c.png" 
                alt="Welcome.Chat Logo" 
                className="h-12" 
              />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/client/dashboard" 
              className="text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
            >
              Dashboard
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-semibold">
                  {clientName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {clientName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/client/widget-settings">Widget Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

