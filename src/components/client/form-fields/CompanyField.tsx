
import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface CompanyFieldProps {
  form: UseFormReturn<any>;
}

export const CompanyField = ({ form }: CompanyFieldProps) => {
  const { register, formState: { errors } } = form;
  
  return (
    <div className="space-y-2">
      <Label htmlFor="company" className="text-sm font-medium text-gray-900">
        Company
      </Label>
      <Input
        id="company"
        {...register("company")}
        className={errors.company ? "border-red-500" : ""}
        placeholder="Company name (optional)"
      />
      {errors.company && (
        <p className="text-sm text-red-500">{errors.company.message?.toString()}</p>
      )}
    </div>
  );
};
