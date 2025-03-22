
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AgentDescriptionFieldProps {
  control: any;
  isRequired?: boolean;
}

export const AgentDescriptionField = ({ control, isRequired = false }: AgentDescriptionFieldProps) => {
  const { register, formState: { errors } } = control;
  
  return (
    <div className="space-y-2">
      <Label htmlFor="agent_description" className="text-sm font-medium text-gray-900">
        Chatbot Description {isRequired && <span className="text-red-500">*</span>}
      </Label>
      <Textarea
        id="agent_description"
        {...register("agent_description")}
        className={errors.agent_description ? "border-red-500" : ""}
        placeholder="Describe your AI assistant's purpose and personality..."
        rows={4}
      />
      {errors.agent_description && (
        <p className="text-sm text-red-500">{errors.agent_description.message?.toString()}</p>
      )}
      <p className="text-xs text-gray-500 mt-1">
        This description helps define how your AI assistant interacts with users. 
        {!isRequired && " Client can set this later."}
      </p>
    </div>
  );
};
