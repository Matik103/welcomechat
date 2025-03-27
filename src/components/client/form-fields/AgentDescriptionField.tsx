
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";

interface AgentDescriptionFieldProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  disabled?: boolean;
  form?: UseFormReturn<any>; // Add support for react-hook-form
}

export function AgentDescriptionField({ value, onChange, disabled = false, form }: AgentDescriptionFieldProps) {
  // If form is provided, use register function, otherwise use direct value/onChange
  if (form) {
    return (
      <div className="space-y-1">
        <Label htmlFor="agent_description">AI Agent Description</Label>
        <Textarea
          id="agent_description"
          {...form.register("agent_description")}
          disabled={disabled}
          placeholder="Describe your AI assistant's purpose and personality..."
          className={`w-full ${form.formState.errors.agent_description ? "border-red-500" : ""}`}
          rows={4}
        />
        {form.formState.errors.agent_description && (
          <p className="text-xs text-red-500">
            {form.formState.errors.agent_description.message?.toString()}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Describe the agent's role, expertise, and personality traits.
        </p>
      </div>
    );
  }
  
  // Original implementation with direct props
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
