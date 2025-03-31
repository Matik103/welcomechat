
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  LayoutDashboard, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  MessageSquare,
  Database 
} from "lucide-react";

export const ClientHeader = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  return (
    <header className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/client/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-gray-900">AI Assistant</span>
          </Link>
        </div>

        <div className="hidden md:flex space-x-4">
          <Button variant="ghost" asChild>
            <Link to="/client/dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          
          <Button variant="ghost" asChild>
            <Link to="/client/resource-settings">
              <Database className="w-4 h-4 mr-2" />
              Resources
            </Link>
          </Button>
          
          <Button variant="ghost" asChild>
            <Link to="/client/widget-settings">
              <MessageSquare className="w-4 h-4 mr-2" />
              Widget Settings
            </Link>
          </Button>
        </div>

        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-2">
                <span className="sr-only">Open menu</span>
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/client/dashboard" className="flex items-center">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link to="/client/profile" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link to="/client/settings" className="flex items-center">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link to="/client/widget-settings" className="flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Widget Settings
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleLogout} className="flex items-center">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
