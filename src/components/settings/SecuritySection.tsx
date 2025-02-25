
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KeyRound, Shield, QrCode } from "lucide-react";

interface SecuritySectionProps {
  mfaEnabled: boolean;
  qrCode: string | null;
  verificationCode: string;
  currentFactorId: string | null;
  onVerificationCodeChange: (code: string) => void;
  onEnableMFA: () => Promise<void>;
  onVerifyMFA: () => Promise<void>;
  onDisableMFA: () => Promise<void>;
}

export const SecuritySection = ({
  mfaEnabled,
  qrCode,
  verificationCode,
  currentFactorId,
  onVerificationCodeChange,
  onEnableMFA,
  onVerifyMFA,
  onDisableMFA
}: SecuritySectionProps) => {
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication (2FA)
          </CardTitle>
          <CardDescription>
            Add an additional layer of security to your account by enabling two-factor authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mfaEnabled ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                <Shield className="h-5 w-5 text-green-500" />
                <p className="text-green-700">
                  Two-factor authentication is enabled and active
                </p>
              </div>
              <Button 
                onClick={onDisableMFA}
                variant="destructive"
                type="button"
              >
                Disable 2FA
              </Button>
            </div>
          ) : qrCode ? (
            <div className="space-y-6">
              <div className="bg-muted p-6 rounded-lg flex flex-col items-center gap-4">
                <QrCode className="h-6 w-6 text-primary" />
                <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
                <div className="text-sm text-center space-y-2">
                  <p className="font-medium">Scan this QR code with your authenticator app</p>
                  <p className="text-muted-foreground">
                    We recommend using Google Authenticator or Authy
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <Label htmlFor="verificationCode">Enter verification code</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => onVerificationCodeChange(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                <Button 
                  onClick={onVerifyMFA}
                  disabled={!verificationCode || verificationCode.length !== 6}
                >
                  Verify and Enable 2FA
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Protect your account with two-factor authentication. Once enabled, you'll need to enter a code from your authenticator app when signing in.
              </p>
              <Button 
                onClick={onEnableMFA} 
                variant="default"
                type="button"
                className="bg-primary hover:bg-primary/90"
              >
                Set up 2FA
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
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
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
};
