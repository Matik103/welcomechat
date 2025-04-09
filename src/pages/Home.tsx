
import React from 'react';
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
  React.useEffect(() => {
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

      {/* Features section */}
      <div className="container py-12 md:py-24">
        <h2 className="text-3xl font-bold text-center mb-16">Key Features</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-brain-circuit"><path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08 2.5 2.5 0 0 0 4.91.05L12 20V4.5Z"/><path d="M16 8V5c0-1.1.9-2 2-2"/><path d="M12 13h4"/><path d="M12 18h6a2 2 0 0 1 2 2v1"/><path d="M12 8h8"/><path d="M20.5 8a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/><path d="M16.5 13a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/><path d="M20.5 21a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/><path d="M18.5 3a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0Z"/></svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Assistance</h3>
            <p className="text-muted-foreground">
              Advanced natural language processing to understand and respond to customer queries with high accuracy.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-database"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/></svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Custom Knowledge Base</h3>
            <p className="text-muted-foreground">
              Integrate your website content, documents, and resources to provide accurate, company-specific responses.
            </p>
          </div>
          
          <div className="bg-card rounded-lg p-6 border shadow-sm">
            <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-line-chart"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Analytics & Insights</h3>
            <p className="text-muted-foreground">
              Track customer interactions, popular queries, and chatbot performance to continuously improve your service.
            </p>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="container py-16 md:py-24">
        <div className="bg-primary/5 rounded-xl p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to enhance your customer support?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Create an account today and start building your AI assistant in minutes.
          </p>
          <Button 
            size="lg" 
            onClick={handleSignInClick}
            className="text-lg font-medium px-8"
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
