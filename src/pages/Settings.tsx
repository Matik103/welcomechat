import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, KeyRound, LogOut, UserCircle, ArrowLeft, Shield, Users } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useInvitations } from "@/hooks/useInvitations";

const Settings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [currentFactorId, setCurrentFactorId] = useState<string | null>(null);
  const { createInvitation, isAdmin } = useInvitations();

  useEffect(() => {
    checkMfaStatus();
  }, []);

  const checkMfaStatus = async () => {
    try {
      const { data: { totp }, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      
      const verifiedFactor = totp.find(factor => factor.status === 'verified');
      setMfaEnabled(!!verifiedFactor);
      
      const unverifiedFactor = totp.find(factor => factor.status === 'unverified');
      if (unverifiedFactor) {
        setCurrentFactorId(unverifiedFactor.id);
      } else {
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
      
      // Clear existing states
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
      
      console.log("Starting MFA enrollment process...");
      
      // First, check for any existing factors
      const { data: existingFactors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        console.error("Error listing factors:", listError);
        throw listError;
      }
      
      console.log("Existing factors:", existingFactors);
      
      // Clean up any existing unverified factors
      const unverifiedFactor = existingFactors.totp.find(f => f.status === 'unverified');
      if (unverifiedFactor) {
        console.log("Cleaning up unverified factor:", unverifiedFactor.id);
        const { error: unenrollError } = await supabase.auth.mfa.unenroll({ 
          factorId: unverifiedFactor.id 
        });
        if (unenrollError) {
          console.error("Error unenrolling factor:", unenrollError);
          throw unenrollError;
        }
      }

      console.log("Enrolling new factor...");
      // Enroll new factor
      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'AI Chatbot Admin System',
        friendlyName: `TOTP-${Date.now()}`
      });
      
      if (enrollError) {
        console.error("Error enrolling factor:", enrollError);
        throw enrollError;
      }
      
      if (!enrollData?.totp) {
        console.error("No TOTP data in enrollment response");
        throw new Error('Failed to generate QR code - no TOTP data received');
      }

      // Store the QR code first
      setQrCode(enrollData.totp.qr_code);

      console.log("Enrollment successful, waiting briefly before getting new factor...");
      
      // Add a small delay to allow the factor to be properly created
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get the newly created factor ID
      const { data: factorsData, error: getFactorsError } = await supabase.auth.mfa.listFactors();
      if (getFactorsError) {
        console.error("Error getting factors after enrollment:", getFactorsError);
        throw getFactorsError;
      }

      console.log("Available factors after enrollment:", factorsData);
      
      const newFactor = factorsData.totp.find(f => f.status === 'unverified');
      if (!newFactor) {
        // Try one more time after a longer delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: retryFactors } = await supabase.auth.mfa.listFactors();
        const retryFactor = retryFactors.totp.find(f => f.status === 'unverified');
        
        if (!retryFactor) {
          console.error("No unverified factor found after retry");
          throw new Error('Failed to find newly created factor');
        }
        
        console.log("Found factor on retry:", retryFactor);
        setCurrentFactorId(retryFactor.id);
      } else {
        console.log("Setting up new factor with ID:", newFactor.id);
        setCurrentFactorId(newFactor.id);
      }
      
    } catch (error: any) {
      console.error('MFA Enrollment Error:', error);
      toast.error(error.message || 'Failed to set up 2FA. Please try again.');
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
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

      // Double check that the factor still exists
      const { data: { totp } } = await supabase.auth.mfa.listFactors();
      const factorToVerify = totp.find(f => f.id === currentFactorId);
      
      if (!factorToVerify) {
        throw new Error("Setup session expired. Please start again.");
      }

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
      console.error('Verification Error:', error);
      if (error.message.includes('Invalid one-time password')) {
        toast.error("Invalid verification code. Please try again.");
      } else {
        toast.error(error.message);
        setQrCode(null);
        setCurrentFactorId(null);
        setVerificationCode("");
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

  const handleInvite = async (role: 'client' | 'admin') => {
    if (!inviteEmail) {
      toast.error("Please enter an email address");
      return;
    }

    try {
      setInviteLoading(true);
      await createInvitation.mutateAsync({
        email: inviteEmail,
        role_type: role
      });
      setInviteEmail("");
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message);
    } finally {
      setInviteLoading(false);
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

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Invite Users
              </CardTitle>
              <CardDescription>
                Send invitations to new clients or administrators
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleInvite('client')}
                    disabled={inviteLoading || !inviteEmail}
                    className="flex-1"
                  >
                    {inviteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : "Invite as Client"}
                  </Button>
                  <Button
                    onClick={() => handleInvite('admin')}
                    disabled={inviteLoading || !inviteEmail}
                    className="flex-1"
                  >
                    {inviteLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : "Invite as Admin"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
