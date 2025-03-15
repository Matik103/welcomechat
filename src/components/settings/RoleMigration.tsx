
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { migrateExistingAdmins, addAdminRoleToUser } from "@/utils/roleMigration";
import { toast } from "sonner";

export const RoleMigration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [migrationCount, setMigrationCount] = useState<number | null>(null);
  
  const handleMigration = async () => {
    try {
      setIsLoading(true);
      const result = await migrateExistingAdmins();
      
      if (result.success) {
        toast.success(`Successfully migrated ${result.count} users to the user_roles table`);
        setMigrationCount(result.count);
      } else {
        toast.error("Failed to migrate users");
      }
    } catch (error) {
      console.error("Error in migration:", error);
      toast.error("An error occurred during migration");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adminEmail) {
      toast.error("Please enter an email address");
      return;
    }
    
    try {
      setIsLoading(true);
      const success = await addAdminRoleToUser(adminEmail);
      
      if (success) {
        toast.success(`Successfully added admin role to ${adminEmail}`);
        setAdminEmail("");
      } else {
        toast.error(`Failed to add admin role to ${adminEmail}`);
      }
    } catch (error) {
      console.error("Error adding admin:", error);
      toast.error("An error occurred while adding admin role");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
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
              "Migrate Existing Users"
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
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Adding...
                </>
              ) : (
                "Add Admin Role"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
