
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AgentDescriptionFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
}

export function AgentDescriptionField({ value, onChange, disabled = false }: AgentDescriptionFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor="agent_description">AI Agent Description</Label>
      <Textarea
        id="agent_description"
        name="agent_description"
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder="Describe your AI assistant's purpose and personality..."
        className="w-full"
        rows={4}
      />
      <p className="text-xs text-muted-foreground">
        Describe the agent's role, expertise, and personality traits.
      </p>
    </div>
  );
}
