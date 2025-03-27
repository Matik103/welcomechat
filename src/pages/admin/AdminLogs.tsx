
import React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoIcon } from 'lucide-react';

export default function AdminLogsPage() {
  return (
    <AdminLayout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">System Logs</h1>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Activity Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <InfoIcon className="h-4 w-4" />
              <AlertTitle>Client Activities Table Removed</AlertTitle>
              <AlertDescription>
                The client_activities table has been temporarily removed from the database and will be rebuilt in the future.
                Activity logging is currently disabled.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">Activity logging has been temporarily disabled as we rebuild the logging system.</p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
