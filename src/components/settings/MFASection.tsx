
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
      
      const verifiedFactor = totp?.find(factor => factor.status === 'verified');
      setMfaEnabled(!!verifiedFactor);
      
      const unverifiedFactor = totp?.find(factor => factor.status === 'unverified');
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

  const waitForFactor = async (factorId: string, maxAttempts = 30): Promise<boolean> => {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Attempt ${i + 1} of ${maxAttempts} to verify factor ${factorId}...`);
      
      try {
        // Add initial delay before first check
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const { data: factorsData, error } = await supabase.auth.mfa.listFactors();
        if (error) {
          console.error('Error listing factors:', error);
          continue;
        }
        
        if (!factorsData?.totp) {
          console.log('No TOTP factors found yet, waiting...');
          continue;
        }
        
        const factor = factorsData.totp.find(f => f.id === factorId);
        if (factor) {
          console.log('Factor found:', factor);
          return true;
        }
      } catch (error) {
        console.error('Error in waitForFactor:', error);
      }
      
      // Increase wait time between attempts
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    return false;
  };

  const handleEnableMFA = async () => {
    try {
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
      
      console.log("Starting MFA enrollment process...");
      
      // Initial delay before starting
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Clean up any existing unverified factors
      const { data: factorsData } = await supabase.auth.mfa.listFactors();
      const existingFactors = factorsData?.totp || [];
      
      for (const factor of existingFactors) {
        if (factor.status === 'unverified') {
          console.log("Cleaning up unverified factor:", factor.id);
          await supabase.auth.mfa.unenroll({ factorId: factor.id });
          // Wait after unenrolling each factor
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Wait after cleanup before enrolling
      await new Promise(resolve => setTimeout(resolve, 3000));

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

      // Set QR code immediately
      setQrCode(enrollData.totp.qr_code);
      
      // Wait before checking for the factor
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Wait for the factor to be available and store its ID
      if (enrollData.id) {
        console.log("Waiting for factor to be created:", enrollData.id);
        const factorFound = await waitForFactor(enrollData.id);
        if (factorFound) {
          console.log("Factor created successfully:", enrollData.id);
          setCurrentFactorId(enrollData.id);
        } else {
          throw new Error('Failed to verify factor creation');
        }
      }
      
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
      
      // Add a delay before creating the challenge
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: currentFactorId
      });
      
      if (challengeError) throw challengeError;

      console.log("Challenge created:", challenge.id);

      // Add a delay before verifying
      await new Promise(resolve => setTimeout(resolve, 3000));

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
