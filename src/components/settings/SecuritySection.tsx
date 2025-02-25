
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KeyRound, Shield } from "lucide-react";

interface SecuritySectionProps {
  mfaEnabled: boolean;
  qrCode: string | null;
  verificationCode: string;
  currentFactorId: string | null;
  onVerificationCodeChange: (code: string) => void;
  onEnableMFA: () => Promise<void>;
  onVerifyMFA: () => Promise<void>;
}

export const SecuritySection = ({
  mfaEnabled,
  qrCode,
  verificationCode,
  currentFactorId,
  onVerificationCodeChange,
  onEnableMFA,
  onVerifyMFA
}: SecuritySectionProps) => {
  const [loading, setLoading] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
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

  const handleMfaEnable = async () => {
    setMfaLoading(true);
    try {
      await onEnableMFA();
    } finally {
      setMfaLoading(false);
    }
  };

  const handleMfaVerify = async () => {
    setMfaLoading(true);
    try {
      await onVerifyMFA();
    } finally {
      setMfaLoading(false);
    }
  };

  return (
    <>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mfaEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Two-factor authentication is currently enabled.
              </p>
            </div>
          ) : qrCode ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img src={qrCode} alt="QR Code for 2FA" className="w-48 h-48" />
              </div>
              <p className="text-sm text-center text-muted-foreground">
                Scan this QR code with your authenticator app
              </p>
              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  value={verificationCode}
                  onChange={(e) => onVerificationCodeChange(e.target.value)}
                  placeholder="Enter the 6-digit code"
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={handleMfaVerify} 
                disabled={mfaLoading || verificationCode.length !== 6}
                className="w-full"
              >
                {mfaLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : "Verify and Enable 2FA"}
              </Button>
            </div>
          ) : (
            <Button onClick={handleMfaEnable} disabled={mfaLoading}>
              {mfaLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : "Enable 2FA"}
            </Button>
          )}
        </CardContent>
      </Card>
    </>
  );
};
