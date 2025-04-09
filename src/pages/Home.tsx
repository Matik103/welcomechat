
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const handleSignInClick = () => {
    navigate('/auth');
  };

  // If user is already logged in, redirect them to the right dashboard
  useEffect(() => {
    if (user && userRole) {
      const dashboardPath = userRole === 'admin' ? '/admin/dashboard' : '/client/dashboard';
      navigate(dashboardPath);
    }
  }, [user, userRole, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero section */}
      <div className="container pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="flex flex-col items-center text-center space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Welcome to <span className="text-primary">AI Chatbot</span> Platform
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl">
            Powerful AI assistants that integrate with your data to help your customers
          </p>
          
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mt-8">
            <Button 
              size="lg" 
              onClick={handleSignInClick}
              className="text-lg font-medium px-8"
            >
              Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              asChild
              className="text-lg font-medium px-8"
            >
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Database reconnect link */}
      <div className="container text-center mt-8">
        <Link to="/database-reconnect" className="text-primary hover:underline">
          Database Reconnection Utility
        </Link>
      </div>
    </div>
  );
}
