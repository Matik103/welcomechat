
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
        
        // First, get all user roles from the user_roles table
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');
          
        if (rolesError) throw rolesError;
        
        if (!rolesData || rolesData.length === 0) {
          setAdmins([]);
          setClients([]);
          setLoading(false);
          return;
        }
        
        // We need to query auth.users table which requires the execute_sql Edge Function
        // This SQL query will join user_roles with auth.users to get emails
        const sqlQuery = `
          SELECT au.id, au.email, ur.role 
          FROM auth.users au
          JOIN public.user_roles ur ON au.id = ur.user_id
        `;
        
        // Call the execute_sql Edge Function with our SQL query
        const { data: usersData, error: usersError } = await supabase.functions.invoke('execute_sql', {
          body: { sql: sqlQuery }
        });
        
        if (usersError) throw usersError;
        
        // Process the returned data
        const userData = usersData?.result || [];
        
        // Process users data into admin and client arrays
        const adminUsers: UserWithRole[] = [];
        const clientUsers: UserWithRole[] = [];
        
        userData.forEach((user: any) => {
          const userWithRole: UserWithRole = {
            id: user.id,
            email: user.email || 'Unknown email',
            role: user.role
          };
          
          if (user.role === 'admin') {
            adminUsers.push(userWithRole);
          } else if (user.role === 'client') {
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
