
import { useState } from "react";
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
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
      });
      
      if (error) throw error;
      
      if (data?.totp) {
        setQrCode(data.totp.qr_code);
        setCurrentFactorId(data.id);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to enable 2FA");
      setQrCode(null);
      setCurrentFactorId(null);
    }
  };

  const handleVerifyMFA = async () => {
    if (!verificationCode || !currentFactorId) return;

    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId: currentFactorId
      });
      
      if (error) throw error;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: currentFactorId,
        challengeId: data.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      setMfaEnabled(true);
      toast.success("2FA enabled successfully");
      
      // Reset the state
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
      
      // Refresh MFA status
      await checkMfaStatus();
    } catch (error: any) {
      toast.error(error.message || "Failed to verify 2FA code");
      setVerificationCode("");
    }
  };

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
