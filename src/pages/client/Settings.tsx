
import { useState, useEffect } from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Client } from "@/types/client";
import { WidgetSettings } from "@/types/widget-settings";
import { Card } from "@/components/ui/card";
import { CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loader2, Info as InfoIcon } from "lucide-react";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { SignOutSection } from "@/components/settings/SignOutSection";
import { extractWidgetSettings } from "@/utils/clientCreationUtils";

const Settings = () => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const clientId = user?.user_metadata?.client_id;
  
  const getLogoUrl = (data: any): string => {
    try {
      if (typeof data?.logo_url === 'string') {
        return data.logo_url;
      }
      
      if (typeof data?.settings?.logo_url === 'string') {
        return data.settings.logo_url;
      }
      
      if (typeof data?.widget_settings?.logo_url === 'string') {
        return data.widget_settings.logo_url;
      }
      
      return '';
    } catch (err) {
      console.error("Error extracting logo URL:", err);
      return '';
    }
  };
  
  useEffect(() => {
    const fetchClientData = async () => {
      if (!clientId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('ai_agents')
          .select('*')
          .eq('id', clientId)
          .maybeSingle();
          
        if (error) {
          throw error;
        }
        
        if (data) {
          const clientData: Client = {
            id: data.id,
            client_id: data.client_id,
            client_name: data.client_name || '',
            email: data.email || '',
            agent_name: data.name,
            agent_description: data.agent_description,
            logo_url: data.logo_url,
            logo_storage_path: data.logo_storage_path,
            status: data.status,
            widget_settings: extractWidgetSettings(data),
          };
          
          setClient(clientData);
        } else {
          setError(new Error("Client not found"));
        }
      } catch (err: any) {
        console.error("Error fetching client data:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchClientData();
  }, [clientId]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] p-8 flex items-center justify-center flex-col">
        <div className="text-red-500 mb-4">Error loading settings: {error.message}</div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-500">Manage your account preferences</p>
        </div>

        <ProfileSection 
          initialFullName={user?.user_metadata?.full_name || ""}
          initialEmail={user?.email || ""}
        />

        <SecuritySection />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <InfoIcon className="h-5 w-5" />
              Client Information
            </CardTitle>
            <CardDescription>
              Information about your AI assistant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {client ? (
              <>
                <div>
                  <p className="text-sm text-gray-500">Company Name</p>
                  <p className="font-medium">{client.client_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">AI Assistant Name</p>
                  <p className="font-medium">{client.agent_name || client.name}</p>
                </div>
                {(client.description || client.agent_description) && (
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="font-medium">{client.description || client.agent_description}</p>
                  </div>
                )}
                {getLogoUrl(client) && (
                  <div>
                    <p className="text-sm text-gray-500">Logo</p>
                    <img 
                      src={getLogoUrl(client)} 
                      alt="AI Assistant Logo" 
                      className="h-12 w-12 object-contain mt-1 border border-gray-200 rounded"
                      onError={(e) => {
                        console.error("Error loading logo in settings:", getLogoUrl(client));
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      client.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {client.status || "active"}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500">No client information available</p>
            )}
          </CardContent>
        </Card>

        <SignOutSection />
      </div>
    </div>
  );
};

export default Settings;
