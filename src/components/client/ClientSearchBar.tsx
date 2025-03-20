
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export interface ClientSearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

export const ClientSearchBar = ({ onSearch, className = "" }: ClientSearchBarProps) => {
  const [searchValue, setSearchValue] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearch(value);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-4 w-4 text-gray-400" />
      </div>
      <Input
        type="text"
        placeholder="Search clients by name, email or agent name..."
        value={searchValue}
        onChange={handleChange}
        className="pl-10"
      />
    </div>
  );
};
