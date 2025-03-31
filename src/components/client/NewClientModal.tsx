
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ClientCreationForm } from "./forms/ClientCreationForm";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewClientModal({ isOpen, onClose }: NewClientModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Create New Client</span>
          </DialogTitle>
        </DialogHeader>
        
        <ClientCreationForm onSuccess={onClose} />
      </DialogContent>
    </Dialog>
  );
}
