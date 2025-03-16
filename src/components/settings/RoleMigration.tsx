
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle, UserPlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { migrateExistingAdmins, addAdminRoleToUser } from "@/utils/roleMigration";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const RoleMigration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [migrationCount, setMigrationCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleMigration = async () => {
    try {
      setIsLoading(true);
      setError(null);
      toast.info("Starting user migration...");
      
      const result = await migrateExistingAdmins();
      
      if (result.success) {
        toast.success(`Successfully migrated ${result.count} users to the user_roles table`);
        setMigrationCount(result.count);
      } else {
        toast.error("Failed to migrate users");
        setError(result.message || "Failed to migrate users. Please check the console for more details.");
      }
    } catch (error: any) {
      console.error("Error in migration:", error);
      setError(error?.message || "An unknown error occurred");
      toast.error("An error occurred during migration: " + (error?.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!adminEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    try {
      setIsAdminLoading(true);
      toast.info(`Attempting to add admin role to ${adminEmail}...`);
      
      const { success, message } = await addAdminRoleToUser(adminEmail);
      
      if (success) {
        toast.success(`Successfully added admin role to ${adminEmail}`);
        setAdminEmail("");
      } else {
        setError(`Failed to add admin role to ${adminEmail}${message ? `: ${message}` : ''}`);
        toast.error(`Failed to add admin role to ${adminEmail}`);
      }
    } catch (error: any) {
      console.error("Error adding admin:", error);
      setError(error?.message || "An unknown error occurred");
      toast.error("Error adding admin role: " + (error?.message || "Unknown error"));
    } finally {
      setIsAdminLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Migrate Existing Admins</CardTitle>
          <CardDescription>
            One-time migration utility to ensure all existing users have proper roles in the user_roles table
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleMigration} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Migrating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Migrate Existing Users
              </>
            )}
          </Button>
          
          {migrationCount !== null && (
            <p className="mt-4 text-sm text-muted-foreground">
              {migrationCount} users were migrated to the user_roles table.
            </p>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Add Admin Role</CardTitle>
          <CardDescription>
            Manually assign admin role to a user by email address
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddAdmin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email Address</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@example.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                disabled={isAdminLoading}
              />
            </div>
            
            <Button type="submit" disabled={isAdminLoading}>
              {isAdminLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Admin Role
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
