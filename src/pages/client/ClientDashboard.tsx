
import React from 'react';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Pencil, Globe } from 'lucide-react';

export default function ClientDashboardPage() {
  const { user } = useAuth();
  
  return (
    <ClientLayout>
      <div className="py-8">
        <h1 className="text-3xl font-bold mb-4">Client Dashboard</h1>
        <p className="mb-6">Welcome to your client dashboard, {user?.user_metadata?.full_name || user?.email}.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Manage your profile and resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/client/edit-info">
                <Button variant="outline" className="w-full justify-start text-left">
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Information & Resources
                </Button>
              </Link>
              <Link to="/client/widget-settings">
                <Button variant="outline" className="w-full justify-start text-left">
                  <Settings className="h-4 w-4 mr-2" />
                  Widget Settings
                </Button>
              </Link>
              <Link to="/client/resource-settings">
                <Button variant="outline" className="w-full justify-start text-left">
                  <Globe className="h-4 w-4 mr-2" />
                  Website & Document Resources
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Help & Resources</CardTitle>
              <CardDescription>
                Get help with using your AI agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Need assistance with your agent? Contact your agent administrator or check the FAQ.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ClientLayout>
  );
}
