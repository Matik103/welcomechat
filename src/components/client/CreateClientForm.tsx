
import { ClientCreationForm } from "./forms/ClientCreationForm";

interface CreateClientFormProps {
  onSuccess: () => void;
}

export default function CreateClientForm({ onSuccess }: CreateClientFormProps) {
  return <ClientCreationForm onSuccess={onSuccess} />;
}
