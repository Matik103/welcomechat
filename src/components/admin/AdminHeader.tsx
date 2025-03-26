
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export const AdminHeader = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo on the left */}
          <div className="flex-shrink-0">
            <Link to="/admin/dashboard">
              <img 
                src="/lovable-uploads/06860347-e947-4d90-8977-b794f49c756a.png" 
                alt="Welcome.Chat Logo" 
                className="h-10"
              />
            </Link>
          </div>
          
          <div className="flex-1 flex justify-end">
            {/* Navigation links moved to the right */}
            <div className="flex items-center gap-6">
              <Link 
                to="/admin/dashboard" 
                className={cn(
                  "text-gray-600 hover:text-primary font-medium px-3 py-2 rounded-md transition-colors",
                  location.pathname === '/admin/dashboard' && "text-primary bg-primary/5"
                )}
              >
                Dashboard
              </Link>
              <Link 
                to="/admin/clients" 
                className={cn(
                  "text-gray-600 hover:text-primary font-medium px-3 py-2 rounded-md transition-colors",
                  location.pathname.includes('/admin/clients') && "text-primary bg-primary/5"
                )}
              >
                Clients
              </Link>
              <Link 
                to="/admin/agents" 
                className={cn(
                  "text-gray-600 hover:text-primary font-medium px-3 py-2 rounded-md transition-colors",
                  location.pathname.includes('/admin/agents') && "text-primary bg-primary/5"
                )}
              >
                Agents
              </Link>
              
              {/* User name on the right (removing gear icon) */}
              <div className="flex items-center ml-6 pl-6 border-l border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  {user?.user_metadata?.full_name || user?.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
