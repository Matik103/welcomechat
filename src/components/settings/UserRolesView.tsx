
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [retryCount, setRetryCount] = useState(0);

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First, get all user roles from the user_roles table
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
          
      if (rolesError) {
        console.error("Role fetching error:", rolesError);
        throw new Error(`Failed to fetch user roles: ${rolesError.message}`);
      }
      
      if (!rolesData || rolesData.length === 0) {
        console.log("No roles found");
        setAdmins([]);
        setClients([]);
        setLoading(false);
        return;
      }
      
      // Get the current session for authentication
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session error:", sessionError);
        throw new Error(`Authentication error: ${sessionError.message}`);
      }
      
      if (!sessionData.session?.access_token) {
        toast.error("Your session has expired. Please sign in again.");
        throw new Error("No authentication token available. Please sign in again.");
      }
      
      // We need to query auth.users table which requires the execute_sql Edge Function
      // This SQL query will join user_roles with auth.users to get emails
      const sqlQuery = `
        SELECT au.id, au.email, ur.role 
        FROM auth.users au
        JOIN public.user_roles ur ON au.id = ur.user_id
      `;
      
      console.log("Calling execute_sql edge function...");
      
      // Call the execute_sql Edge Function with our SQL query
      // Include the auth token in the request
      const { data: usersData, error: usersError } = await supabase.functions.invoke('execute_sql', {
        body: { sql: sqlQuery },
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`
        }
      });
      
      if (usersError) {
        console.error("Edge function error:", usersError);
        throw new Error(`Failed to fetch user data: ${usersError.message}`);
      }
      
      if (!usersData) {
        console.error("No data returned from edge function");
        throw new Error("No data returned from server");
      }
      
      // Process the returned data
      const userData = usersData?.result || [];
      
      if (!Array.isArray(userData)) {
        console.warn("Unexpected response format:", userData);
        throw new Error(`Unexpected response format: ${JSON.stringify(userData).substring(0, 100)}`);
      }
      
      console.log(`Received ${userData.length} user records`);
      
      // Process users data into admin and client arrays
      const adminUsers: UserWithRole[] = [];
      const clientUsers: UserWithRole[] = [];
      
      userData.forEach((user: any) => {
        if (!user || typeof user !== 'object') return;
        
        const userWithRole: UserWithRole = {
          id: user.id || 'Unknown ID',
          email: user.email || 'Unknown email',
          role: user.role || 'Unknown role'
        };
        
        if (user.role === 'admin') {
          adminUsers.push(userWithRole);
        } else if (user.role === 'client') {
          clientUsers.push(userWithRole);
        }
      });
      
      setAdmins(adminUsers);
      setClients(clientUsers);
      console.log(`Processed ${adminUsers.length} admins and ${clientUsers.length} clients`);
    } catch (err: any) {
      console.error("Error fetching user roles:", err);
      setError(err.message || "Failed to fetch user roles");
      toast.error("Failed to load user roles: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchUserRoles();
  }, [retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    toast.info("Retrying to fetch user roles...");
  };

  if (loading) {
    return (
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <span>Loading user roles...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-6 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-700 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Error Loading User Roles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Failed to load user roles</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="mb-4 text-sm text-gray-700">
            This could be due to network issues or authentication problems. If the issue persists, try logging out and back in.
          </p>
          <Button onClick={handleRetry} variant="outline" className="flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Admin Users ({admins.length})</CardTitle>
            <CardDescription>
              Users with administrator privileges
            </CardDescription>
          </div>
          <Button onClick={handleRetry} variant="outline" size="sm" className="h-8">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
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
