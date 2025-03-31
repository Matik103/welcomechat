
import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Upload } from 'lucide-react';

interface AgentFormFieldsProps {
  agentName: string;
  setAgentName: (value: string) => void;
  agentDescription: string;
  setAgentDescription: (value: string) => void;
  logoFile: File | null;
  logoPreview: string | null;
  handleLogoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function AgentFormFields({
  agentName,
  setAgentName,
  agentDescription,
  setAgentDescription,
  logoFile,
  logoPreview,
  handleLogoChange
}: AgentFormFieldsProps) {
  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <Avatar className="h-24 w-24">
            {logoPreview ? (
              <AvatarImage src={logoPreview} alt="Agent logo preview" />
            ) : null}
            <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
              <Bot className="h-12 w-12" />
            </AvatarFallback>
          </Avatar>
          <label htmlFor="logo-upload" className="absolute -bottom-2 -right-2 bg-primary text-white p-1.5 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
            <Upload className="h-4 w-4" />
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </label>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="agent-name">Agent Name</Label>
          <Input
            id="agent-name"
            placeholder="Enter agent name"
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="agent-description">
            Agent Description / System Prompt
          </Label>
          <Textarea
            id="agent-description"
            placeholder="Describe your agent and its purpose..."
            className="min-h-[120px]"
            value={agentDescription}
            onChange={(e) => setAgentDescription(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            This description is used as the system prompt for the AI.
          </p>
        </div>
      </div>
    </div>
  );
}
