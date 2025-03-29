
import { UnifiedClientModal } from "./UnifiedClientModal";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  return <UnifiedClientModal isOpen={isOpen} onClose={onClose} />;
}
