
import { useAuth } from "@/contexts/AuthContext";
import { Link, useLocation } from "react-router-dom";
import { Settings, LogOut, Home, Edit, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";

export const ClientHeader = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path) ? "bg-primary text-white" : "bg-transparent text-gray-700";
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/client/view" className="text-xl font-semibold text-gray-900">
              AI Assistant Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/client/view">
              <Button variant="ghost" size="sm" className={`flex items-center gap-1 ${isActive('/client/view')}`}>
                <Home className="h-4 w-4" />
                <span className="hidden md:inline">Dashboard</span>
              </Button>
            </Link>
            <Link to="/client/edit">
              <Button variant="ghost" size="sm" className={`flex items-center gap-1 ${isActive('/client/edit')}`}>
                <Edit className="h-4 w-4" />
                <span className="hidden md:inline">Edit Profile</span>
              </Button>
            </Link>
            <Link to="/client/widget/settings">
              <Button variant="ghost" size="sm" className={`flex items-center gap-1 ${isActive('/client/widget/settings')}`}>
                <Sliders className="h-4 w-4" />
                <span className="hidden md:inline">Widget</span>
              </Button>
            </Link>
            <Link to="/client/settings">
              <Button variant="ghost" size="sm" className={`flex items-center gap-1 ${isActive('/client/settings')}`}>
                <Settings className="h-4 w-4" />
                <span className="hidden md:inline">Settings</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="flex items-center gap-1">
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
