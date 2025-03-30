
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
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
import { Settings, User, LogOut } from "lucide-react";

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
  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

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
              className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
            >
              Dashboard
            </Link>
            <Link 
              to="/client/resource-settings" 
              className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
            >
              Resources
            </Link>
            <Link 
              to="/client/widget-settings" 
              className="text-sm font-medium text-gray-900 hover:text-gray-700 transition-colors"
            >
              Widget
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="font-medium flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {displayName}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  {clientName}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link to="/client/account-settings">
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
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
