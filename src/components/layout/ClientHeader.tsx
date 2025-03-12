import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Settings, Palette, UserCog, Edit, LayoutDashboard, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export const ClientHeader = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-6">
            <Link to="/client/dashboard" className="text-xl font-semibold text-gray-900">
              AI Agent Dashboard
            </Link>
            <nav className="flex items-center gap-4">
              <Link 
                to="/client/dashboard" 
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive('/client/dashboard') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Link 
                to="/client/view" 
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive('/client/view') ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Resources</span>
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56" sideOffset={16}>
                <DropdownMenuItem asChild>
                  <Link to="/client/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>General Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/client/resource-settings" className="flex items-center">
                    <Palette className="mr-2 h-4 w-4" />
                    <span>Resource Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/client/edit-info" className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Information</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/client/account-settings" className="flex items-center">
                    <UserCog className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="ghost" 
              onClick={() => signOut?.()}
              className="text-sm"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
