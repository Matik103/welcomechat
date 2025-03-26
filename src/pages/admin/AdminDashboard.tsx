
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Users, ArrowUpRight, BarChart4 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  
  return (
    <AdminLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="dashboard-heading">Welcome.Chat Dashboard</h1>
          <p className="dashboard-subheading mt-2">
            Websites & Documents that Talk - Admin Portal
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="stat-label">Total Clients</p>
                  <p className="stat-value mt-2">523</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    <span>12% from last month</span>
                  </p>
                </div>
                <div className="bg-primary/10 p-2 rounded-md">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="stat-label">Active Agents</p>
                  <p className="stat-value mt-2">328</p>
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    <span>8% from last month</span>
                  </p>
                </div>
                <div className="bg-indigo-100 p-2 rounded-md">
                  <BarChart4 className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 flex flex-col justify-between h-full">
              <div>
                <h3 className="subheading-text text-lg font-medium mb-1">
                  Quick Actions
                </h3>
                <p className="text-sm text-gray-500">
                  Access frequently used tools
                </p>
              </div>
              <div className="mt-4 space-y-2">
                <Button 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/clients/new')}
                >
                  Add New Client
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/admin/analytics')}
                >
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-4">Admin Resources</h2>
          <p className="body-text mb-4">
            Welcome to the Welcome.Chat administration portal. From here you can manage
            clients, monitor usage, and configure system settings.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="subheading-text text-lg font-medium mb-2">Client Management</h3>
                <p className="text-sm text-gray-500 mb-3">Add, edit, and manage client accounts</p>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/clients')}
                >
                  Manage Clients
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <h3 className="subheading-text text-lg font-medium mb-2">System Settings</h3>
                <p className="text-sm text-gray-500 mb-3">Configure global platform settings</p>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/settings')}
                >
                  Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
