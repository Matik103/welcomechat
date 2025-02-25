
import { ClientForm } from "@/components/client/ClientForm";
import { Card } from "@/components/ui/card";
import { ClientFormData } from "@/types/client";
import { UseMutationResult } from "@tanstack/react-query";

interface ProfileSectionProps {
  client: ClientFormData;
  clientMutation: UseMutationResult<string, Error, ClientFormData>;
}

export function ProfileSection({ client, clientMutation }: ProfileSectionProps) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
      <ClientForm
        initialData={client}
        onSubmit={(data) => clientMutation.mutate(data)}
        isLoading={clientMutation.isPending}
      />
    </Card>
  );
}
