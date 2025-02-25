
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KeyRound, LogOut, UserCircle, ArrowLeft, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [currentFactorId, setCurrentFactorId] = useState<string | null>(null);

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data: { totp }, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      setMfaEnabled(totp.length > 0 && totp.some(factor => factor.status === 'verified'));
      
      // Reset QR code if no verification is in progress
      if (totp.length === 0 || totp.every(factor => factor.status === 'verified')) {
        setQrCode(null);
        setCurrentFactorId(null);
      }
    } catch (error: any) {
      console.error('Error checking MFA status:', error);
    }
  };

  const handleEnableMFA = async () => {
    try {
      setLoading(true);
      
      // Clear any existing state
      setCurrentFactorId(null);
      setQrCode(null);
      
      // First, check for any existing factors
      const { data: existingFactors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) throw listError;
      
      // If there's an unverified factor, we need to clean it up
      const unverifiedFactor = existingFactors.totp.find(f => f.status === 'unverified');
      if (unverifiedFactor) {
        // Unenroll the existing unverified factor
        await supabase.auth.mfa.unenroll({ factorId: unverifiedFactor.id });
      }

      // Now enroll a new factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'AI Chatbot Admin System',
        friendlyName: `TOTP-${Date.now()}` // Add a unique friendly name
      });
      
      if (error) throw error;
      if (data.totp) {
        setQrCode(data.totp.qr_code);
        // Store the new factor ID
        const { data: { totp } } = await supabase.auth.mfa.listFactors();
        const newFactor = totp.find(f => f.status === 'unverified');
        if (newFactor) {
          setCurrentFactorId(newFactor.id);
        }
      }
    } catch (error: any) {
      console.error('MFA Error:', error);
      toast.error(error.message);
      setQrCode(null);
      setCurrentFactorId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode) {
      toast.error("Please enter the verification code");
      return;
    }

    if (!currentFactorId) {
      toast.error("No pending 2FA setup found. Please start the process again.");
      setQrCode(null);
      return;
    }

    try {
      setLoading(true);

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: currentFactorId
      });
      
      if (challengeError) throw challengeError;

      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: currentFactorId,
        challengeId: challenge.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      setMfaEnabled(true);
      setQrCode(null);
      setVerificationCode("");
      setCurrentFactorId(null);
      toast.success("2FA has been enabled successfully");
      await checkMfaStatus();
    } catch (error: any) {
      toast.error(error.message);
      // Only clear states if it's not a verification code error
      if (!error.message.includes('Invalid one-time password')) {
        setQrCode(null);
        setCurrentFactorId(null);
      }
    } finally {
      setLoading(false);
    }
  };

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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
        data: { full_name: fullName }
      });
      if (error) throw error;
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            to="/"
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Account Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and security preferences
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your profile details and email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Update Profile
              </Button>
            </form>
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
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter the 6-digit code"
                    maxLength={6}
                  />
                </div>
                <Button 
                  onClick={handleVerifyMFA} 
                  disabled={loading || verificationCode.length !== 6}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : "Verify and Enable 2FA"}
                </Button>
              </div>
            ) : (
              <Button onClick={handleEnableMFA} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : "Enable 2FA"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <LogOut className="h-5 w-5" />
              Sign Out
            </CardTitle>
            <CardDescription>
              Sign out of your account on this device
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
