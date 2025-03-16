
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

type UserWithRole = {
  id: string;
  email: string;
  role: string;
}

export const UserRolesView = () => {
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<UserWithRole[]>([]);
  const [clients, setClients] = useState<UserWithRole[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRoles = async () => {
      try {
        setLoading(true);
        
        // First, get all user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');
          
        if (rolesError) throw rolesError;
        
        if (!rolesData || rolesData.length === 0) {
          setAdmins([]);
          setClients([]);
          return;
        }
        
        // Extract user IDs to get their emails
        const userIds = rolesData.map(item => item.user_id);
        
        // Get user emails from auth.users via a Supabase function or separate query
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, email')
          .in('id', userIds);
          
        if (userError) throw userError;
        
        // Create a map of user IDs to emails for easy lookup
        const userEmailMap = new Map();
        userData?.forEach(user => {
          userEmailMap.set(user.id, user.email);
        });
        
        // Format data for admins and clients
        const adminUsers: UserWithRole[] = [];
        const clientUsers: UserWithRole[] = [];
        
        rolesData.forEach(roleItem => {
          const userEmail = userEmailMap.get(roleItem.user_id) || 'Unknown email';
          const userWithRole: UserWithRole = {
            id: roleItem.user_id,
            email: userEmail,
            role: roleItem.role
          };
          
          if (roleItem.role === 'admin') {
            adminUsers.push(userWithRole);
          } else if (roleItem.role === 'client') {
            clientUsers.push(userWithRole);
          }
        });
        
        setAdmins(adminUsers);
        setClients(clientUsers);
      } catch (err: any) {
        console.error("Error fetching user roles:", err);
        setError(err.message || "Failed to fetch user roles");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserRoles();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading user roles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-300 bg-red-50 text-red-800 rounded-md">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Admin Users ({admins.length})</CardTitle>
          <CardDescription>
            Users with administrator privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No admin users found
                  </TableCell>
                </TableRow>
              ) : (
                admins.map(admin => (
                  <TableRow key={admin.id}>
                    <TableCell className="font-mono text-xs">{admin.id}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {admin.role}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Client Users ({clients.length})</CardTitle>
          <CardDescription>
            Users with client access privileges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">
                    No client users found
                  </TableCell>
                </TableRow>
              ) : (
                clients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono text-xs">{client.id}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {client.role}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
