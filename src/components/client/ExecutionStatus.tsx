
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Clock, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

interface ExecutionStatusProps {
  status: ExecutionStatus;
  title: string;
  description?: string;
  className?: string;
}

export const ExecutionStatus = ({ 
  status, 
  title, 
  description, 
  className 
}: ExecutionStatusProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />;
      case 'completed':
        return <Check className="h-6 w-6 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'border-yellow-200 bg-yellow-50';
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'completed':
        return 'border-green-200 bg-green-50';
      case 'failed':
        return 'border-red-200 bg-red-50';
    }
  };

  return (
    <Card className={cn("border", getStatusColor(), className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          {getStatusIcon()}
          {title}
        </CardTitle>
      </CardHeader>
      {description && (
        <CardContent>
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
      )}
    </Card>
  );
};

export default ExecutionStatus;
