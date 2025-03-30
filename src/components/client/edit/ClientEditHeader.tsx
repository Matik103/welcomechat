
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';

interface ClientEditHeaderProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
}

export const ClientEditHeader: React.FC<ClientEditHeaderProps> = ({
  title,
  subtitle,
  onBack
}) => {
  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="mb-4 flex items-center gap-1"
        onClick={onBack}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>
      
      <h1 className="text-2xl font-bold mb-6">
        {title}
        {subtitle && (
          <p className="text-sm font-normal text-muted-foreground">
            {subtitle}
          </p>
        )}
      </h1>
    </>
  );
};
