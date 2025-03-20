
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              You are logged in as {user?.email}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>This is your new dashboard after removing the client management system.</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end">
        <Button 
          variant="outline"
          disabled={isLoading}
          onClick={() => {
            setIsLoading(true);
            // Simulate loading
            setTimeout(() => setIsLoading(false), 1000);
          }}
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
