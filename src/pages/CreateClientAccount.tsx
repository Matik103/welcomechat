
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientAccountForm } from '@/components/client/ClientAccountForm';
import { toast } from 'sonner';
import { createOpenAIAssistant } from '@/utils/clientOpenAIUtils';

export default function CreateClientAccount() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Form submission logic would go here
      console.log("Creating client with data:", data);
      
      // Example: If we had a client ID after creation, we would create the OpenAI assistant
      // const clientId = "example-client-id";
      // await createOpenAIAssistant(
      //   clientId,
      //   data.agent_name,
      //   data.agent_description,
      //   data.client_name
      // );
      
      toast.success("Client account created successfully!");
      navigate('/admin/clients');
    } catch (error) {
      console.error("Error creating client account:", error);
      toast.error("Failed to create client account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <PageHeading>
          Create New Client Account
          <p className="text-sm font-normal text-muted-foreground">
            Set up a new client account with AI assistant
          </p>
        </PageHeading>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <ClientAccountForm onSubmit={handleSubmit} isLoading={isSubmitting} />
      </div>
    </div>
  );
}
