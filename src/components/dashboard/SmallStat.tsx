
import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SmallStatProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  description: string;
  colorClass: string;
}

export const SmallStat: React.FC<SmallStatProps> = ({
  title,
  value,
  icon,
  description,
  colorClass
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-sm">{title}</h3>
          <div className={`rounded-full p-2 ${colorClass}`}>
            {icon}
          </div>
        </div>
        <div className="flex flex-col">
          <div className="text-3xl font-bold">{value}</div>
          <div className="text-xs text-muted-foreground mt-1">{description}</div>
        </div>
      </CardContent>
    </Card>
  );
};
