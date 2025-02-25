
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TwoFactorSettings {
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  backup_codes?: string[];
}

export function use2FA(clientId?: string) {
  const [qrCode, setQrCode] = useState<string>();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["2fa-settings", clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("two_factor_enabled, two_factor_secret, backup_codes")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      return data as TwoFactorSettings;
    },
    enabled: !!clientId,
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      // This would typically call an Edge Function to generate TOTP secret and QR code
      const { data, error } = await supabase.functions.invoke("setup-2fa", {
        body: { client_id: clientId },
      });

      if (error) throw error;
      setQrCode(data.qrCode);
      return data;
    },
    onError: (error: any) => {
      toast.error(`Failed to setup 2FA: ${error.message}`);
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase
        .from("clients")
        .update({
          two_factor_enabled: true,
        })
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-settings"] });
      toast.success("Two-factor authentication enabled");
    },
    onError: (error: any) => {
      toast.error(`Failed to enable 2FA: ${error.message}`);
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      const { error } = await supabase
        .from("clients")
        .update({
          two_factor_enabled: false,
          two_factor_secret: null,
          backup_codes: null,
        })
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["2fa-settings"] });
      toast.success("Two-factor authentication disabled");
    },
    onError: (error: any) => {
      toast.error(`Failed to disable 2FA: ${error.message}`);
    },
  });

  return {
    settings,
    isLoading,
    qrCode,
    setup: setupMutation.mutate,
    enable: enableMutation.mutate,
    disable: disableMutation.mutate,
    isSettingUp: setupMutation.isPending,
    isEnabling: enableMutation.isPending,
    isDisabling: disableMutation.isPending,
  };
}
