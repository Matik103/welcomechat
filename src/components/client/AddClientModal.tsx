
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import CreateClientForm from "./CreateClientForm";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader className="flex justify-between items-center">
          <DialogTitle>Create New Client</DialogTitle>
        </DialogHeader>
        <CreateClientForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}
