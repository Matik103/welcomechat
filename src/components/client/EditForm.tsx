
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface EditFormProps {
  initialData?: any;
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
  isLoading?: boolean;
}

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
});

export function EditForm({ initialData, onSubmit, isLoading = false }: EditFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialData?.full_name || "",
      email: initialData?.email || "",
    },
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      setValue("name", initialData.full_name || "");
      setValue("email", initialData.email || "");
    }
  }, [initialData, setValue]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium text-gray-900">
          Name
        </Label>
        <Input
          id="name"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium text-gray-900">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          {...register("email")}
          className={errors.email ? "border-red-500" : ""}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
