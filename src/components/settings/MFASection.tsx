
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  const [isVerifying, setIsVerifying] = useState(false);

  const checkMfaStatus = async () => {
    try {
      const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const hasVerifiedFactor = factorsData.totp.some(factor => factor.status === 'verified');
      setMfaEnabled(hasVerifiedFactor);
      
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
    if (isVerifying) return;

    try {
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      let factorToVerify: MFAFactor | null = null;
      const existingTotpFactor = factors.totp.find(factor => factor.status === 'unverified');
      
      if (existingTotpFactor) {
        factorToVerify = existingTotpFactor as MFAFactor;
      } else {
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

    if (isVerifying) {
      return; // Prevent multiple verification attempts
    }

    try {
      setIsVerifying(true);

      // Create a challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: currentFactorId
      });
      
      if (challengeError) {
        throw challengeError;
      }

      if (!challenge) {
        throw new Error('No challenge created');
      }

      // Verify the challenge with the code
      const { data, error: verifyError } = await supabase.auth.mfa.verify({
        factorId: currentFactorId,
        challengeId: challenge.id,
        code: verificationCode
      });

      if (verifyError) {
        throw verifyError;
      }

      if (!data) {
        throw new Error('Verification failed');
      }

      await checkMfaStatus();
      toast.success("2FA has been successfully enabled!");
      
      // Reset states after successful verification
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
    } catch (error: any) {
      console.error('Verify Error:', error);
      toast.error(error.message || "Failed to verify 2FA code. Please try again.");
      setVerificationCode("");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisableMFA = async () => {
    if (isVerifying) return;

    try {
      setIsVerifying(true);
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      const totpFactor = factors.totp.find(factor => factor.status === 'verified');
      if (!totpFactor?.id) {
        throw new Error('No active 2FA factor found');
      }

      const { error: unenrollError } = await supabase.auth.mfa.unenroll({
        factorId: totpFactor.id
      });
      
      if (unenrollError) throw unenrollError;

      await checkMfaStatus();
      toast.success("2FA has been successfully disabled");
    } catch (error: any) {
      console.error('Disable 2FA Error:', error);
      toast.error(error.message || "Failed to disable 2FA");
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    checkMfaStatus();
  }, []);

  return {
    mfaEnabled,
    qrCode,
    verificationCode,
    currentFactorId,
    isVerifying,
    setVerificationCode,
    checkMfaStatus,
    handleEnableMFA,
    handleVerifyMFA,
    handleDisableMFA
  };
};
