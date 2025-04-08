
import React, { useState, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClientCreationForm } from "./forms/ClientCreationForm";
import { LoadingSpinner } from "./LoadingStates";

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddClientModal({ isOpen, onClose }: AddClientModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
        </DialogHeader>
        
        <Suspense fallback={
          <div className="flex justify-center p-8">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        }>
          <ClientCreationForm onSuccess={onClose} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}

export default { AddClientModal };
