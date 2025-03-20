
import { ClientForm } from "@/components/client/ClientForm";
import { Card } from "@/components/ui/card";
import { Client } from "@/types/client";
import { UseMutationResult } from "@tanstack/react-query";

interface ProfileSectionProps {
  client: Client;
  clientMutation: UseMutationResult<string, Error, Omit<Client, 'id'>, unknown>;
}

export function ProfileSection({ client, clientMutation }: ProfileSectionProps) {
  const handleSubmit = async (data: Omit<Client, 'id'>) => {
    await clientMutation.mutateAsync(data);
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
      <ClientForm
        initialData={client}
        onSubmit={handleSubmit}
        isLoading={clientMutation.isPending}
      />
    </Card>
  );
}
