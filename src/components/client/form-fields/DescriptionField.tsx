
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface DescriptionFieldProps {
  form: UseFormReturn<any>;
}

export const DescriptionField = ({ form }: DescriptionFieldProps) => {
  const { register, formState: { errors } } = form;
  
  return (
    <div className="space-y-2">
      <Label htmlFor="description" className="text-sm font-medium text-gray-900">
        Description
      </Label>
      <Textarea
        id="description"
        {...register("description")}
        className={errors.description ? "border-red-500" : ""}
        placeholder="Brief description of the client (optional)"
        rows={3}
      />
      {errors.description && (
        <p className="text-sm text-red-500">{errors.description.message?.toString()}</p>
      )}
    </div>
  );
};
