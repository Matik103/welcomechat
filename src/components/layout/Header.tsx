
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, User, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export const Header = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      await signOut();
      // Navigation is handled inside signOut function
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) return null;

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo with preload */}
          <Link to="/admin/dashboard" className="flex items-center">
            <div className="h-10">
              <img 
                src="/lovable-uploads/e262d378-49c1-4219-ae37-ce0264b3500c.png" 
                alt="WelcomeChat Logo" 
                className="h-full w-auto"
                loading="eager"
                decoding="async"
              />
            </div>
          </Link>

          {/* Right side navigation */}
          <div className="flex items-center gap-6">
            <nav className="flex items-center gap-6">
              <Link 
                to="/admin/dashboard" 
                className={`text-gray-600 hover:text-gray-900 font-medium ${
                  location.pathname === '/admin/dashboard' || location.pathname === '/' ? 'text-gray-900' : ''
                }`}
              >
                Dashboard
              </Link>
              <Link 
                to="/admin/clients" 
                className={`text-gray-600 hover:text-gray-900 font-medium ${
                  location.pathname.includes('/admin/clients') ? 'text-gray-900' : ''
                }`}
              >
                Customers
              </Link>
              <Link 
                to="/admin/agents" 
                className={`text-gray-600 hover:text-gray-900 font-medium ${
                  location.pathname.includes('/admin/agents') ? 'text-gray-900' : ''
                }`}
              >
                Agents
              </Link>
            </nav>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hover:bg-gray-100 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <span className="font-medium">{user.user_metadata.full_name || user.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-gray-200">
                <DropdownMenuItem asChild>
                  <Link to="/admin/settings" className="w-full cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};
