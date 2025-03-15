
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

type UserWithRole = {
  id: string;
  email: string;
  role: 'admin' | 'client';
  user_id: string;
  role_id: string;
};

export const UserRolesList = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Query the user_roles table joined with auth.users to get emails
        const { data, error } = await supabase
          .from('user_roles')
          .select(`
            id:id,
            role_id:id,
            user_id,
            role,
            users:user_id (
              email
            )
          `);
        
        if (error) {
          throw error;
        }
        
        // Transform the data for easier display
        const formattedUsers = data.map((item: any) => ({
          id: item.user_id,
          email: item.users?.email || 'No email available',
          role: item.role,
          user_id: item.user_id,
          role_id: item.role_id
        }));
        
        setUsers(formattedUsers);
      } catch (err: any) {
        console.error("Error fetching users:", err);
        setError(err.message || "Failed to fetch user roles");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  // Group users by role
  const adminUsers = users.filter(user => user.role === 'admin');
  const clientUsers = users.filter(user => user.role === 'client');

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">User Roles</h1>
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="bg-destructive/10 p-4 rounded-md text-destructive">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Admin Users */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Users ({adminUsers.length})</CardTitle>
              <CardDescription>Users with administrative privileges</CardDescription>
            </CardHeader>
            <CardContent>
              {adminUsers.length === 0 ? (
                <p className="text-muted-foreground">No admin users found</p>
              ) : (
                <ul className="space-y-2">
                  {adminUsers.map(user => (
                    <li key={user.role_id} className="p-2 border rounded-md">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">ID: {user.user_id}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          
          {/* Client Users */}
          <Card>
            <CardHeader>
              <CardTitle>Client Users ({clientUsers.length})</CardTitle>
              <CardDescription>Users with client-level access</CardDescription>
            </CardHeader>
            <CardContent>
              {clientUsers.length === 0 ? (
                <p className="text-muted-foreground">No client users found</p>
              ) : (
                <ul className="space-y-2">
                  {clientUsers.map(user => (
                    <li key={user.role_id} className="p-2 border rounded-md">
                      <div className="font-medium">{user.email}</div>
                      <div className="text-sm text-muted-foreground">ID: {user.user_id}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
