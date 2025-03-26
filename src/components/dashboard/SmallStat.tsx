
import { cn } from '@/lib/utils';

interface SmallStatProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  colorClass?: string;
}

export const SmallStat = ({
  title,
  value,
  icon,
  description,
  colorClass = 'text-primary bg-primary/10',
}: SmallStatProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 stat-label">{title}</p>
          <p className="mt-2 text-3xl font-bold stat-value">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        <div className={cn('p-2 rounded-md', colorClass)}>
          {icon}
        </div>
      </div>
    </div>
  );
};
