
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Custom hook to fetch data for the current user - modified to work without the clients table
 */
export const useClientData = () => {
  const { user, userRole } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [userData, setUserData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || userRole !== "user") {
        setIsLoading(false);
        return;
      }

      try {
        // Instead of fetching from clients table, we'll get user profile data
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          throw error;
        }

        setUserData(data || {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "User"
        });
      } catch (err: any) {
        console.error("Error fetching user data:", err);
        setError(err.message);
        toast.error("Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, userRole]);

  return { userData, isLoading, error };
};
