
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const { user, signOut, userRole } = useAuth();
  const navigate = useNavigate();

  const getInitials = (email: string) => {
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (!user) return null;

  return (
    <header className="border-b bg-background">
      <div className="flex h-16 items-center px-4 md:px-8">
        <div className="flex items-center space-x-8">
          <Link to={userRole === 'admin' ? '/admin' : '/dashboard'} className="text-xl font-bold">
            AI Chatbot
          </Link>
          {userRole === 'admin' && (
            <>
              <Link to="/clients" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Clients
              </Link>
              <Link to="/settings" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Settings
              </Link>
            </>
          )}
          {userRole === 'client' && (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Dashboard
              </Link>
              <Link to="/settings" className="text-sm font-medium text-muted-foreground hover:text-primary">
                Settings
              </Link>
            </>
          )}
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt={user.email} />
                  <AvatarFallback>{user.email ? getInitials(user.email) : 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};
