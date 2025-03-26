
import React, { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface SmallStatProps {
  title: string;
  value: string | number;
  description: string;
  icon: ReactNode;
  colorClass?: string;
}

export const SmallStat: React.FC<SmallStatProps> = ({
  title,
  value,
  description,
  icon,
  colorClass = 'text-primary bg-primary/10'
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <div className={`p-2 rounded-full ${colorClass}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
