
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useMFAHandlers = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [currentFactorId, setCurrentFactorId] = useState<string | null>(null);

  const checkMfaStatus = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (error) throw error;
      
      setMfaEnabled(data.currentLevel === 'aal2');
      
      // Clear any existing setup state
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
    } catch (error) {
      console.error('Error checking MFA status:', error);
    }
  };

  const handleEnableMFA = async () => {
    try {
      // First check for existing factors
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (factorsError) throw factorsError;

      // If there are no existing TOTP factors, enroll a new one
      const totpFactor = factors.totp?.[0];
      if (!totpFactor) {
        const { data, error } = await supabase.auth.mfa.enroll({
          factorType: 'totp'
        });
        
        if (error) throw error;
        
        if (data?.totp) {
          setQrCode(data.totp.qr_code);
          setCurrentFactorId(data.id);
        }
      } else {
        // If a factor exists but isn't verified, show the QR code again
        if (totpFactor.status === 'unverified') {
          setQrCode(totpFactor.totp?.qr_code || null);
          setCurrentFactorId(totpFactor.id);
        }
      }
    } catch (error: any) {
      console.error('MFA Error:', error);
      toast.error(error.message || "Failed to enable 2FA");
      setQrCode(null);
      setCurrentFactorId(null);
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode || !currentFactorId) return;

    try {
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

      toast.success("2FA enabled successfully");
      await checkMfaStatus(); // Refresh MFA status after successful verification
      
      // Reset the state
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
    } catch (error: any) {
      console.error('Verify Error:', error);
      toast.error(error.message || "Failed to verify 2FA code");
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
