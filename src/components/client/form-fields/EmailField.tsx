
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface EmailFieldProps {
  control: any;
}

export const EmailField = ({ control }: EmailFieldProps) => {
  const { register, formState: { errors } } = control;
  
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
