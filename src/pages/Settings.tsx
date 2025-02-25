import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { InvitationsSection } from "@/components/settings/InvitationsSection";
import { SignOutSection } from "@/components/settings/SignOutSection";

const Settings = () => {
  const { user } = useAuth();
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
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode || !currentFactorId) {
      return;
    }

    try {
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
        setVerificationCode("");
      } else {
        setQrCode(null);
        setCurrentFactorId(null);
        setVerificationCode("");
      }
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

        <ProfileSection 
          initialFullName={user?.user_metadata?.full_name || ""}
          initialEmail={user?.email || ""}
        />

        <SecuritySection
          mfaEnabled={mfaEnabled}
          qrCode={qrCode}
          verificationCode={verificationCode}
          currentFactorId={currentFactorId}
          onVerificationCodeChange={setVerificationCode}
          onEnableMFA={handleEnableMFA}
          onVerifyMFA={handleVerifyMFA}
        />

        <InvitationsSection />

        <SignOutSection />
      </div>
    </div>
  );
};

export default Settings;
