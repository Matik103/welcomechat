
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

  const handleEnableMFA = async () => {
    try {
      setQrCode(null);
      setCurrentFactorId(null);
      setVerificationCode("");
      
      console.log("Starting MFA enrollment process...");
      
      const { data: existingFactors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) {
        console.error("Error listing factors:", listError);
        throw listError;
      }
      
      console.log("Existing factors:", existingFactors);
      
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

      setQrCode(enrollData.totp.qr_code);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: factorsData, error: getFactorsError } = await supabase.auth.mfa.listFactors();
      if (getFactorsError) {
        console.error("Error getting factors after enrollment:", getFactorsError);
        throw getFactorsError;
      }

      console.log("Available factors after enrollment:", factorsData);
      
      const newFactor = factorsData.totp.find(f => f.status === 'unverified');
      if (!newFactor) {
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
