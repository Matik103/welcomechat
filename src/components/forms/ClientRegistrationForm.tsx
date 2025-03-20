import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Form validation schema
const registrationSchema = z.object({
  client_name: z.string().min(2, 'Client name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  bot_settings: z.object({
    bot_name: z.string().min(2, 'Bot name must be at least 2 characters'),
    bot_personality: z.string().min(2, 'Bot personality must be at least 2 characters'),
    bot_logo: z.any().optional(), // File object
  }),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

interface ClientRegistrationFormProps {
  onSubmit: (data: RegistrationValues) => Promise<void>;
}

export function ClientRegistrationForm({ onSubmit }: ClientRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      client_name: '',
      email: '',
      bot_settings: {
        bot_name: '',
        bot_personality: '',
        bot_logo: null,
      },
    },
  });

  const { isSubmitting } = form.formState;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      form.setValue('bot_settings.bot_logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (data: RegistrationValues) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      form.reset();
      setLogoPreview(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Client Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name">Client Name</Label>
            <Input
              id="client_name"
              {...form.register('client_name')}
              placeholder="Enter client name"
              disabled={isSubmitting}
            />
            {form.formState.errors.client_name && (
              <p className="text-sm text-red-500">{form.formState.errors.client_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register('email')}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Chat Bot Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bot_name">Bot Name</Label>
            <Input
              id="bot_name"
              {...form.register('bot_settings.bot_name')}
              placeholder="Enter bot name"
              disabled={isSubmitting}
            />
            {form.formState.errors.bot_settings?.bot_name && (
              <p className="text-sm text-red-500">{form.formState.errors.bot_settings.bot_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot_personality">Bot Personality</Label>
            <Textarea
              id="bot_personality"
              {...form.register('bot_settings.bot_personality')}
              placeholder="Describe the bot's personality"
              disabled={isSubmitting}
            />
            {form.formState.errors.bot_settings?.bot_personality && (
              <p className="text-sm text-red-500">{form.formState.errors.bot_settings.bot_personality.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bot_logo">Bot Logo</Label>
            <div className="flex items-center space-x-4">
              <Input
                id="bot_logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                disabled={isSubmitting}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('bot_logo')?.click()}
                disabled={isSubmitting}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose Logo
              </Button>
              {logoPreview && (
                <div className="relative w-16 h-16">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "Registering..." : "Register AI Agent"}
        </Button>
      </div>
    </form>
  );
} 