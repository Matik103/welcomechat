
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AccessStatus } from "@/types/extended-supabase";
import { Toast } from "@/components/ui/use-toast";
import { toast } from "sonner";

export function useDriveAccessCheck() {
  const [isValidating, setIsValidating] = useState(false);

  const checkLinkAccessMutation = useMutation({
    mutationFn: async (link: string): Promise<AccessStatus> => {
      setIsValidating(true);
      try {
        const { data, error } = await supabase.functions.invoke(
          "check-drive-access",
          {
            body: { link },
          }
        );

        if (error) {
          console.error("Error checking drive access:", error);
          return "inaccessible";
        }

        return data.access_status as AccessStatus;
      } catch (err) {
        console.error("Error in drive access check:", err);
        return "inaccessible";
      } finally {
        setIsValidating(false);
      }
    },
    onError: (error) => {
      toast.error("Failed to validate drive link: " + error.message);
      setIsValidating(false);
    },
  });

  const validateDriveLink = async (link: string): Promise<AccessStatus> => {
    if (!link) {
      toast.error("Please provide a Google Drive link");
      return "inaccessible";
    }

    // Very basic URL validation
    if (!link.includes("drive.google.com")) {
      toast.warning("This does not appear to be a Google Drive link");
    }

    try {
      const result = await checkLinkAccessMutation.mutateAsync(link);
      if (result === "accessible") {
        toast.success("Drive link is accessible");
      } else if (result === "inaccessible") {
        toast.error(
          "This drive link is not accessible. Please make sure it's public or accessible to anyone with the link."
        );
      } else {
        toast.warning("Could not determine drive link accessibility");
      }
      return result;
    } catch (error) {
      toast.error("Error validating drive link");
      return "inaccessible";
    }
  };

  return {
    validateDriveLink,
    isValidating,
    validationResult: checkLinkAccessMutation.data || null,
  };
}
