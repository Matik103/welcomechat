
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

interface AgentNameFieldProps {
  form: UseFormReturn<any>;
  isClientView?: boolean;
  defaultValue?: string;
}

export const AgentNameField = ({ form, isClientView = false, defaultValue }: AgentNameFieldProps) => {
  const { register, formState: { errors }, setValue } = form;
  
  // Set default value when component mounts
  useEffect(() => {
    if (defaultValue) {
      setValue("agent_name", defaultValue);
    }
  }, [defaultValue, setValue]);

  return (
    <div className="space-y-2">
      <Label htmlFor="agent_name" className="text-sm font-medium text-gray-900">
        Chatbot Name {isClientView && <span className="text-red-500">*</span>}
      </Label>
      <Input
        id="agent_name"
        {...register("agent_name")}
        className={errors.agent_name ? "border-red-500" : ""}
        placeholder="AI Assistant"
      />
      {errors.agent_name && (
        <p className="text-sm text-red-500">{errors.agent_name.message?.toString()}</p>
      )}
      {!isClientView && (
        <p className="text-xs text-gray-500 mt-1">Optional - "AI Assistant" will be used if not specified. Client can set this later. Do not use quotes.</p>
      )}
    </div>
  );
};
