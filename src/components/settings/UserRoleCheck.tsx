
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, Zap } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import { checkUserRoleByEmail, testEdgeFunctionConnectivity } from "@/utils/edgeFunctionUtil";

export const UserRoleCheck = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    roles?: string[];
    message?: string;
  } | null>(null);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }
    
    setIsLoading(true);
    setResult(null);
    
    try {
      const roleResult = await checkUserRoleByEmail(email);
      setResult(roleResult);
      
      if (roleResult.success) {
        if (roleResult.roles && roleResult.roles.length > 0) {
          toast.success(`Found roles for ${email}: ${roleResult.roles.join(", ")}`);
        } else {
          toast.info(`No roles found for ${email}`);
        }
      } else {
        toast.error(roleResult.message || "Failed to check user role");
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      toast.error("Error checking user role: " + (error.message || "Unknown error"));
      setResult({
        success: false,
        message: error.message || "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      await testEdgeFunctionConnectivity();
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check User Role</CardTitle>
        <CardDescription>
          Diagnose user roles by email address
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCheck} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="check-email">User Email</Label>
            <Input
              id="check-email"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Check Role
                </>
              )}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleTestConnection} 
              disabled={isTesting}
            >
              {isTesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
        
        {result && (
          <Alert className={`mt-4 ${result.success ? 'bg-green-50' : 'bg-red-50'}`}>
            <AlertTitle>{result.success ? 'User Information' : 'Error'}</AlertTitle>
            <AlertDescription>
              {result.message}
              {result.success && result.roles && (
                <div className="mt-2">
                  <strong>Roles: </strong>
                  {result.roles.length > 0 ? 
                    result.roles.map(role => (
                      <span key={role} className="inline-block bg-blue-100 text-blue-800 rounded-full px-2 py-1 text-xs font-semibold mr-2">
                        {role}
                      </span>
                    )) : 
                    <span className="text-gray-500 italic">No roles assigned</span>
                  }
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
