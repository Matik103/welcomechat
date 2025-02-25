
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MFASectionProps {
  mfaEnabled: boolean;
  setMfaEnabled: (enabled: boolean) => void;
  qrCode: string | null;
  setQrCode: (qrCode: string | null) => void;
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  currentFactorId: string | null;
  setCurrentFactorId: (id: string | null) => void;
}

export const useMFAHandlers = () => {
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [currentFactorId, setCurrentFactorId] = useState<string | null>(null);

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

  const waitForFactor = async (maxAttempts = 10): Promise<string> => {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Attempt ${i + 1} of ${maxAttempts} to find factor...`);
      
      // First wait before checking to give time for factor creation
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      
      const { data: factorsData, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        console.error('Error listing factors:', error);
        continue;
      }
      
      console.log('Current factors:', factorsData);
      const newFactor = factorsData.totp.find(f => f.status === 'unverified');
      
      if (newFactor) {
        console.log('Found new factor:', newFactor.id);
        return newFactor.id;
      }
    }
    throw new Error('Failed to find newly created factor after multiple attempts');
  };

  const handleEnableMFA = async () => {
    try {
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
      
      console.log("Starting MFA enrollment process...");
      
      // Clean up any existing unverified factors
      const { data: existingFactors } = await supabase.auth.mfa.listFactors();
      const unverifiedFactor = existingFactors.totp.find(f => f.status === 'unverified');
      
      if (unverifiedFactor) {
        console.log("Cleaning up unverified factor:", unverifiedFactor.id);
        await supabase.auth.mfa.unenroll({ factorId: unverifiedFactor.id });
        
        // Wait a bit after cleanup
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log("Enrolling new factor...");
      const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'AI Chatbot Admin System',
        friendlyName: `TOTP-${Date.now()}`
      });
      
      if (enrollError) throw enrollError;
      
      if (!enrollData?.totp) {
        throw new Error('Failed to generate QR code - no TOTP data received');
      }

      setQrCode(enrollData.totp.qr_code);
      
      // Wait for the factor to be available with increased attempts
      console.log("Waiting for factor to be created...");
      const factorId = await waitForFactor();
      console.log("Factor created successfully:", factorId);
      setCurrentFactorId(factorId);
      
    } catch (error: any) {
      console.error('MFA Enrollment Error:', error);
      toast.error(error.message || "Failed to enable 2FA");
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
      console.log("Starting verification for factor:", currentFactorId);
      
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: currentFactorId
      });
      
      if (challengeError) throw challengeError;

      console.log("Challenge created:", challenge.id);

      const { error: verifyError } = await supabase.auth.mfa.verify({
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
      toast.error(error.message || "Failed to verify 2FA code");
      if (error.message.includes('Invalid one-time password')) {
        setVerificationCode("");
      } else {
        setQrCode(null);
        setCurrentFactorId(null);
        setVerificationCode("");
      }
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
