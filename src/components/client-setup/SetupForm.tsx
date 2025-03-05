
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface SetupFormProps {
  isLoading: boolean;
  setupComplete: boolean;
  password: string;
  confirmPassword: string;
  setPassword: (password: string) => void;
  setConfirmPassword: (confirmPassword: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

const SetupForm = ({
  isLoading,
  setupComplete,
  password,
  confirmPassword,
  setPassword,
  setConfirmPassword,
  handleSubmit
}: SetupFormProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Complete Your Setup</CardTitle>
          <CardDescription>
            Create a password to access your AI Assistant dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || setupComplete}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading || setupComplete}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || setupComplete}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : setupComplete ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupForm;
