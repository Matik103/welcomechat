
import { useParams, useNavigate } from 'react-router-dom';
import { ClientForm } from '@/components/client/ClientForm';
import { useClientData } from '@/hooks/useClientData';
import { ClientFormData } from '@/types/client-form';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useClientActivity } from '@/hooks/useClientActivity';
import { useAuth } from '@/contexts/AuthContext';

export default function EditClientInfo() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { client, isLoading, error, refetch } = useClientData(id);
  const { logClientActivity } = useClientActivity();
  
  const handleSubmit = async (data: ClientFormData) => {
    if (!id) {
      toast.error('Client ID is required');
      return;
    }

    try {
      // Update the client record
      const { error } = await supabase
        .from('ai_agents')
        .update({
          client_name: data.client_name,
          name: data.agent_name,
          agent_description: data.agent_description,
          email: data.email,
          logo_url: data.logo_url,
          logo_storage_path: data.logo_storage_path,
          updated_at: new Date().toISOString(),
        })
        .eq('client_id', id)
        .eq('interaction_type', 'config');

      if (error) throw error;

      // Log the client update activity
      await logClientActivity({
        client_id: id,
        activity_type: 'CLIENT_UPDATED',
        activity_data: {
          updated_by: user?.id || 'unknown',
          client_name: data.client_name,
          email: data.email,
        },
      });

      toast.success('Client information updated successfully');
      
      // Refresh the client data
      await refetch();
      
      // Navigate back to the client view
      navigate(`/admin/clients/view/${id}`);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error(`Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleBack = () => {
    navigate(`/admin/clients/view/${id}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <p className="text-lg font-semibold">Error loading client</p>
          <p>{error}</p>
          <Button
            variant="outline"
            onClick={() => navigate('/admin/clients')}
            className="mt-4"
          >
            Back to Clients
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Client Information</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <ClientForm
            initialData={client || null}
            onSubmit={handleSubmit}
            submitButtonText="Save Changes"
          />
        </CardContent>
      </Card>
    </div>
  );
}
