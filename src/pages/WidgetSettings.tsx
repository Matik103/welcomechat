import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useClientData } from "@/hooks/useClientData";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import WidgetForm from "@/components/widget/WidgetForm";

const WidgetSettings = () => {
  const { user } = useAuth();
  const clientId = user?.user_metadata?.client_id;
  const { client, isLoadingClient, error } = useClientData(clientId);
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      toast.error("Failed to load client data");
      console.error("Error loading client data:", error);
    }
  }, [error]);

  const handleBack = () => {
    navigate("/client/view");
  };

  if (isLoadingClient) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSaveWidgetSettings = async (settings: any) => {
    try {
      if (!clientId) {
        toast.error("Client ID is required to save widget settings");
        return;
      }

      // Update the client data in Supabase
      const { data, error } = await supabase
        .from('clients')
        .update({ widget_settings: settings })
        .eq('id', clientId)
        .select()
        .single();

      if (error) {
        toast.error("Failed to save widget settings");
        console.error("Error saving widget settings:", error);
      } else {
        toast.success("Widget settings saved successfully");
      }
    } catch (error) {
      toast.error("Failed to save widget settings");
      console.error("Error saving widget settings:", error);
    }
  };

  // Parse the widget settings from the client data
  const widgetSettings = client?.widget_settings ? 
    (typeof client.widget_settings === 'string' 
      ? JSON.parse(client.widget_settings) 
      : client.widget_settings) as any
    : undefined;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path
                fillRule="evenodd"
                d="M15 10a.75.75 0 01-.22.53l-4 4a.75.75 0 01-1.06-1.06l3.22-3.22H5.75a.75.75 0 010-1.5h7.19L9.72 6.53a.75.75 0 011.06-1.06l4 4a.75.75 0 01.22.53z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Widget Settings
            </h1>
            <p className="text-gray-500">Customize your widget settings</p>
          </div>
        </div>

        <div className="space-y-8">
          {client && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <WidgetForm
                initialSettings={widgetSettings}
                onSave={handleSaveWidgetSettings}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WidgetSettings;
