
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ClientFormData } from "@/types/client";

const ClientSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ClientFormData>({
    defaultValues: {
      client_name: "",
      email: user?.email || "",
      agent_name: "",
      company: "",
      description: ""
    }
  });

  const onSubmit = async (data: ClientFormData) => {
    if (!user) {
      toast.error("You must be logged in to complete setup");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First, check if a client record already exists for this user
      const { data: existingClient, error: checkError } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (checkError) {
        throw new Error(checkError.message);
      }
      
      if (existingClient) {
        toast.info("Your client account is already set up");
        navigate("/client/view");
        return;
      }
      
      // Create a new client
      // Note: We link user_id through an RLS policy
      const { data: clientData, error: insertError } = await supabase
        .from("clients")
        .insert({
          client_name: data.client_name,
          email: data.email,
          agent_name: data.agent_name,
          company: data.company || null,
          description: data.description || null,
          status: "active"
        })
        .select("id")
        .single();
      
      if (insertError) {
        throw new Error(insertError.message);
      }

      // Create activity for the new client
      await supabase.from("client_activities").insert({
        client_id: clientData.id,
        activity_type: "client_created",
        description: `Client account set up with agent name: ${data.agent_name}`
      });
      
      toast.success("Setup completed successfully!");
      
      // Redirect to client dashboard
      navigate("/client/view");
    } catch (error: any) {
      console.error("Setup error:", error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Setup</CardTitle>
          <CardDescription>
            Configure your AI assistant by providing the following information.
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="client_name">Client/Business Name</Label>
              <Input 
                id="client_name"
                {...register("client_name", { required: "Client name is required" })}
                placeholder="Your business name"
              />
              {errors.client_name && (
                <p className="text-sm text-red-500">{errors.client_name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                type="email"
                {...register("email", { required: "Email is required" })}
                placeholder="contact@yourbusiness.com"
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="agent_name">AI Agent Name</Label>
              <Input 
                id="agent_name"
                {...register("agent_name", { required: "Agent name is required" })}
                placeholder="e.g. Sales Assistant"
              />
              {errors.agent_name && (
                <p className="text-sm text-red-500">{errors.agent_name.message}</p>
              )}
              <p className="text-xs text-gray-500">
                This will be the name of your AI assistant
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company/Organization (Optional)</Label>
              <Input 
                id="company"
                {...register("company")}
                placeholder="Your company or organization"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input 
                id="description"
                {...register("description")}
                placeholder="Brief description of your business"
              />
            </div>
          </CardContent>
          
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Setting up..." : "Complete Setup"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default ClientSetup;
