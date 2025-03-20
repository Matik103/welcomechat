
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, Menu } from 'lucide-react';

const DashboardLayout = () => {
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto flex justify-between items-center p-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden"
            >
              <Menu />
            </Button>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:inline">{user?.email}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex">
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 bg-white border-r h-[calc(100vh-64px)] sticky top-16`}>
          <nav className="p-4">
            <ul className="space-y-2">
              <li>
                <a 
                  href="/dashboard"
                  className="block px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  Dashboard
                </a>
              </li>
            </ul>
          </nav>
        </aside>
        
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
