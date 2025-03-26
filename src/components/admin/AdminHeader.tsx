
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
                src="/lovable-uploads/e262d378-49c1-4219-ae37-ce0264b3500c.png" 
                alt="Welcome.Chat Logo" 
                className="h-12" // Increased from h-10 to h-12
              />
            </Link>
          </div>
          
          <div className="flex-1 flex justify-center">
            {/* Search bar would go here if needed */}
          </div>

          {/* Navigation links and user info */}
          <div className="flex items-center gap-4">
            <nav className="flex items-center space-x-6">
              <Link 
                to="/admin/dashboard" 
                className={cn(
                  "text-gray-600 hover:text-primary font-medium transition-colors",
                  location.pathname === '/admin/dashboard' && "text-primary font-semibold"
                )}
              >
                Dashboard
              </Link>
              <Link 
                to="/admin/clients" 
                className={cn(
                  "text-gray-600 hover:text-primary font-medium transition-colors",
                  location.pathname.includes('/admin/clients') && "text-primary font-semibold"
                )}
              >
                Clients
              </Link>
              <Link 
                to="/admin/agents" 
                className={cn(
                  "text-gray-600 hover:text-primary font-medium transition-colors",
                  location.pathname.includes('/admin/agents') && "text-primary font-semibold"
                )}
              >
                Agents
              </Link>
            </nav>
            
            {/* User name instead of settings icon */}
            <div className="flex items-center ml-6 pl-6 border-l border-gray-200">
              <div className="text-sm font-medium text-gray-700 px-3 py-2 rounded-lg bg-gray-100">
                {user?.user_metadata?.full_name || user?.email}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
