
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AgentNameFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function AgentNameField({ value, onChange, disabled = false }: AgentNameFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="agent_name">AI Agent Name</Label>
      <Input
        id="agent_name"
        name="agent_name"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="Enter AI agent name"
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">
        Name that will be displayed to users interacting with the AI agent.
      </p>
    </div>
  );
}
