
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Define our own interface for MFA factor
interface MFAFactor {
  id: string;
  status: 'verified' | 'unverified';
  totp?: {
    qr_code: string;
  };
}

export const useMFAHandlers = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [currentFactorId, setCurrentFactorId] = useState<string | null>(null);

  const checkMfaStatus = async () => {
    try {
      // Check current MFA status
      const { data: aal, error: aalError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalError) throw aalError;
      
      // Check existing factors
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const hasVerifiedFactor = factorsData.totp.some(factor => factor.status === 'verified');
      setMfaEnabled(hasVerifiedFactor);
      
      // Clear setup state if MFA is already enabled
      if (hasVerifiedFactor) {
        setQrCode(null);
        setCurrentFactorId(null);
        setVerificationCode("");
      }
    } catch (error) {
      console.error('Error checking MFA status:', error);
      toast.error("Failed to check 2FA status");
    }
  };

  const handleEnableMFA = async () => {
    try {
      // Clear any previous state
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");

      // Check existing factors first
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      let factorToVerify: MFAFactor | null = null;

      // Check for existing unverified TOTP factor
      const existingTotpFactor = factors.totp.find(factor => factor.status === 'unverified');
      
      if (existingTotpFactor) {
        factorToVerify = existingTotpFactor as MFAFactor;
      } else {
        // Enroll new factor if none exists
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp'
        });
        
        if (error) throw error;
        if (!data) throw new Error('No data returned from enrollment');
        
        factorToVerify = data as unknown as MFAFactor;
      }

      if (factorToVerify) {
        setQrCode(factorToVerify.totp?.qr_code || null);
        setCurrentFactorId(factorToVerify.id);
      }
    } catch (error: any) {
      console.error('MFA Error:', error);
      toast.error(error.message || "Failed to setup 2FA");
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode || !currentFactorId) {
      toast.error("Please enter a verification code");
      return;
    }

    try {
      // Create challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: currentFactorId
      });
      
      if (challengeError) throw challengeError;
      if (!challenge) throw new Error('No challenge created');

      // Verify the challenge
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: currentFactorId,
        challengeId: challenge.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      await checkMfaStatus(); // Refresh MFA status
      toast.success("2FA has been successfully enabled!");
      
      // Reset state
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
    } catch (error: any) {
      console.error('Verify Error:', error);
      toast.error(error.message || "Failed to verify 2FA code. Please try again.");
      setVerificationCode("");
    }
  };

  // Initial check of MFA status
  useEffect(() => {
    checkMfaStatus();
  }, []);

  return {
    mfaEnabled,
    qrCode,
    verificationCode,
    currentFactorId,
    setVerificationCode,
    checkMfaStatus,
    handleEnableMFA,
    handleVerifyMFA
  };
};
