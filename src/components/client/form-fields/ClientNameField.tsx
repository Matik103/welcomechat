
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

interface ClientNameFieldProps {
  form: UseFormReturn<any>;
  defaultValue?: string;
}

export const ClientNameField = ({ form, defaultValue }: ClientNameFieldProps) => {
  const { register, formState: { errors }, setValue } = form;
  
  // Set default value when component mounts
  useEffect(() => {
    if (defaultValue) {
      setValue("client_name", defaultValue);
    }
  }, [defaultValue, setValue]);

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
