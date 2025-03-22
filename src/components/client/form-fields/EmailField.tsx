
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useEffect } from "react";

interface EmailFieldProps {
  form: UseFormReturn<any>;
  defaultValue?: string;
}

export const EmailField = ({ form, defaultValue }: EmailFieldProps) => {
  const { register, formState: { errors }, setValue } = form;
  
  // Set default value when component mounts
  useEffect(() => {
    if (defaultValue) {
      setValue("email", defaultValue);
    }
  }, [defaultValue, setValue]);

  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="text-sm font-medium text-gray-900">
        Email Address <span className="text-red-500">*</span>
      </Label>
      <Input
        id="email"
        type="email"
        {...register("email")}
        className={errors.email ? "border-red-500" : ""}
      />
      {errors.email && (
        <p className="text-sm text-red-500">{errors.email.message?.toString()}</p>
      )}
    </div>
  );
};
