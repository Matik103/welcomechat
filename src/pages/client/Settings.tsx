
import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { User, FileText, Bot } from 'lucide-react';

export default function ClientSettings() {
  return (
    <ClientLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Profile Settings Card */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Update your profile information and resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Manage your client information, agent details, and training resources like websites and documents.
              </p>
              <Button asChild>
                <Link to="/client/edit-info" className="w-full">
                  Manage Profile
                </Link>
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
        </div>
      </div>
    </ClientLayout>
  );
}
