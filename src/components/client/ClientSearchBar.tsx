import React from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface ClientSearchBarProps {
  value: string;
  onChange: (query: string) => void;
  className?: string;
  disabled?: boolean;
}

export const ClientSearchBar: React.FC<ClientSearchBarProps> = ({ 
  value, 
  onChange,
  className = '',
  disabled = false
}) => {
  return (
    <div className={`relative ${className} ${disabled ? 'opacity-50' : ''}`}>
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Search clients..."
        className="pl-10 bg-white"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </div>
  );
};
