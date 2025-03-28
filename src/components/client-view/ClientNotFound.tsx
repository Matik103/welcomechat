
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ClientNotFoundProps {
  message?: string;
  buttonText?: string;
  buttonLink?: string;
}

export const ClientNotFound: React.FC<ClientNotFoundProps> = ({
  message = "The client you are looking for could not be found.",
  buttonText = "Back to Clients",
  buttonLink = "/admin/clients"
}) => {
  return (
    <div className="container py-12 text-center min-h-[60vh]">
      <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
      <p className="mb-8">{message}</p>
      <Button asChild>
        <Link to={buttonLink}>{buttonText}</Link>
      </Button>
    </div>
  );
};
