
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ClientNameFieldProps {
  form: UseFormReturn<any>;
}

export const ClientNameField = ({ form }: ClientNameFieldProps) => {
  const { register, formState: { errors } } = form;
  
  return (
    <div className="space-y-2">
      <Label htmlFor="client_name" className="text-sm font-medium text-gray-900">
        Client Name <span className="text-red-500">*</span>
      </Label>
      <Input
        id="client_name"
        {...register("client_name")}
        className={errors.client_name ? "border-red-500" : ""}
      />
      {errors.client_name && (
        <p className="text-sm text-red-500">{errors.client_name.message?.toString()}</p>
      )}
    </div>
  );
};
