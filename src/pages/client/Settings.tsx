
import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { User, FileText, Bot, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientData } from '@/hooks/useClientData';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function ClientSettings() {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { client, isLoadingClient, error } = useClientData(clientId);
  const navigate = useNavigate();

  if (error) {
    return (
      <ClientLayout>
        <div className="container mx-auto py-8">
          <ErrorDisplay 
            title="Error Loading Settings"
            message={`Unable to load your information: ${error instanceof Error ? error.message : String(error)}`}
            details="Please try again or contact support if the issue persists."
            onRetry={() => window.location.reload()}
          />
        </div>
      </ClientLayout>
    );
  }

  const handleProfileClick = () => {
    navigate('/client/edit-info');
  };

  return (
    <ClientLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your company information and AI assistant details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Manage your profile, company information, AI assistant details, and customize your logo.
              </p>
              <Button onClick={handleProfileClick} className="w-full">
                Manage Profile
              </Button>
            </CardContent>
          </Card>
          
          {/* Resource Settings Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                Resource Settings
              </CardTitle>
              <CardDescription>
                Manage your website and document resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Add, edit, or remove websites and documents that your AI assistant uses for training.
              </p>
              <Button asChild>
                <Link to="/client/resource-settings" className="w-full">
                  Manage Resources
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Widget Settings Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-blue-500" />
                Widget Settings
              </CardTitle>
              <CardDescription>
                Customize your AI chat widget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Customize the appearance, behavior, and messaging of your AI chat widget.
              </p>
              <Button asChild>
                <Link to="/client/widget-settings" className="w-full">
                  Customize Widget
                </Link>
              </Button>
            </CardContent>
          </Card>
          
          {/* Account Security Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Account Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Update your password, enable two-factor authentication, and manage other security features.
              </p>
              <Button asChild>
                <Link to="/client/account-settings" className="w-full">
                  Manage Security
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientLayout>
  );
}
