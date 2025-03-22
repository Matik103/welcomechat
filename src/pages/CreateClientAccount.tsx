
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeading } from '@/components/dashboard/PageHeading';
import { ClientAccountForm } from '@/components/client/ClientAccountForm';
import { toast } from 'sonner';

export default function CreateClientAccount() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
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
        <ClientAccountForm />
      </div>
    </div>
  );
}
