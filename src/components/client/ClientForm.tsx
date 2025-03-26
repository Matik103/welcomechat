
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { ClientNameField } from './form-fields/ClientNameField';
import { EmailField } from './form-fields/EmailField';
import { CompanyField } from './form-fields/CompanyField';
import { DescriptionField } from './form-fields/DescriptionField';
import { AgentNameField } from './form-fields/AgentNameField';
import { AgentDescriptionField } from './form-fields/AgentDescriptionField';
import { LogoUploadField } from './form-fields/LogoUploadField';

export interface ClientFormProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  isSubmitting?: boolean;
}

const ClientForm: React.FC<ClientFormProps> = ({ form, onSubmit, isSubmitting = false }) => {
  const handleSubmit = form.handleSubmit(onSubmit);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <ClientNameField form={form} />
          <EmailField form={form} />
          <CompanyField form={form} />
          <DescriptionField form={form} />
        </div>
        
        <div className="space-y-6">
          <AgentNameField form={form} />
          <AgentDescriptionField form={form} />
          <LogoUploadField form={form} />
        </div>
      </div>
      
      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
