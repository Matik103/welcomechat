
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";

interface AgentNameFieldProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  form?: UseFormReturn<any>; // Add support for react-hook-form
}

export function AgentNameField({ value, onChange, disabled = false, form }: AgentNameFieldProps) {
  // If form is provided, use register function, otherwise use direct value/onChange
  if (form) {
    return (
      <div className="space-y-1">
        <Label htmlFor="agent_name">AI Agent Name</Label>
        <Input
          id="agent_name"
          {...form.register("agent_name")}
          disabled={disabled}
          placeholder="Enter AI agent name"
          className={`w-full ${form.formState.errors.agent_name ? "border-red-500" : ""}`}
        />
        {form.formState.errors.agent_name && (
          <p className="text-xs text-red-500">
            {form.formState.errors.agent_name.message?.toString()}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Name that will be displayed to users interacting with the AI agent.
        </p>
      </div>
    );
  }
  
  // Original implementation with direct props
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
