
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

export interface TokenData {
  id?: string;
  token?: string;
  client_id?: string;
  email?: string;
  created_at?: string;
  expires_at?: string;
  // Remove status field as it doesn't exist in the table
}

export const useSetupToken = () => {
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        setIsLoading(true);
        const query = new URLSearchParams(location.search);
        const token = query.get("token");

        if (!token) {
          console.error("No token provided in URL");
          setIsValidToken(false);
          return;
        }

        // Verify token with Supabase
        const { data, error } = await supabase
          .from("client_invitations")
          .select("*")
          .eq("token", token)
          .single();

        if (error) {
          console.error("Error verifying token:", error);
          setIsValidToken(false);
          return;
        }

        // Check if token has expired
        const expirationDate = new Date(data.expires_at);
        const now = new Date();
        
        if (now > expirationDate) {
          setIsExpired(true);
          setIsValidToken(false);
          toast.error("This invitation link has expired. Please contact the administrator for a new invitation.");
          return;
        }

        setTokenData({
          id: data.id,
          token: data.token,
          client_id: data.client_id,
          email: data.email,
          created_at: data.created_at,
          expires_at: data.expires_at
        });
        
        setIsValidToken(true);
      } catch (error) {
        console.error("Error in token verification:", error);
        setIsValidToken(false);
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [location.search]);

  return {
    isValidToken,
    isExpired,
    tokenData,
    isLoading
  };
};
