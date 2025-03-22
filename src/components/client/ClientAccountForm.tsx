import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, X, User, Mail, MessageSquare, Image } from 'lucide-react';
import { generateTempPassword, saveClientTempPassword, logClientCreationActivity } from '@/utils/clientCreationUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

export function ClientAccountForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    email: '',
    agentName: 'AI Assistant',
    agentDescription: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toastShownRef = useRef<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size and type
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Logo file must be less than 5MB");
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, GIF, SVG, WebP)");
      return;
    }
    
    setLogoFile(file);
    
    // Generate preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    
    // Reset the toast reference to ensure we don't block new toasts with the same ID
    toastShownRef.current = null;
    
    const loadingToast = toast.loading("Creating client account...");
    toastShownRef.current = loadingToast;
    
    try {
      // Generate a temporary password - explicitly typed as string to prevent type error
      const tempPassword: string = generateTempPassword();
      let logoUrl = '';
      let logoStoragePath = '';
      
      // Upload logo if exists
      if (logoFile) {
        const fileName = `${Date.now()}-${logoFile.name}`;
        const filePath = `widget-logos/${fileName}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('widget-logos')
          .upload(filePath, logoFile);
        
        if (uploadError) {
          throw new Error(`Logo upload failed: ${uploadError.message}`);
        }
        
        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('widget-logos')
          .getPublicUrl(filePath);
        
        logoUrl = publicUrl;
        logoStoragePath = filePath;
      }
      
      // Create client in ai_agents table
      const { data: clientData, error: clientError } = await supabase
        .from('ai_agents')
        .insert({
          name: formData.agentName,
          client_name: formData.clientName,
          email: formData.email,
          agent_description: formData.agentDescription,
          logo_url: logoUrl,
          logo_storage_path: logoStoragePath,
          content: '',
          interaction_type: 'config',
          settings: {
            client_name: formData.clientName,
            email: formData.email,
            agent_name: formData.agentName,
            agent_description: formData.agentDescription,
            logo_url: logoUrl,
            logo_storage_path: logoStoragePath
          }
        })
        .select('id')
        .single();
      
      if (clientError) {
        throw new Error(`Client creation failed: ${clientError.message}`);
      }
      
      // Save the client credentials and create auth user
      await saveClientTempPassword(clientData.id, formData.email, tempPassword);
      
      // Log client activity
      await logClientCreationActivity(
        clientData.id, 
        formData.clientName,
        formData.email,
        formData.agentName
      );
      
      // Send welcome email
      const { data: emailData, error: emailError } = await supabase.functions.invoke(
        'send-welcome-email',
        {
          body: {
            clientId: clientData.id,
            clientName: formData.clientName,
            email: formData.email,
            agentName: formData.agentName,
            tempPassword: tempPassword
          }
        }
      );
      
      if (emailError) {
        console.error("Email sending error:", emailError);
        toast.error("Client created but welcome email failed to send", { id: loadingToast });
      } else if (emailData && !emailData.success) {
        console.error("Email sending failed:", emailData.error);
        toast.error("Client created but welcome email failed to send", { id: loadingToast });
      } else {
        toast.success("Client created successfully and welcome email sent", { id: loadingToast });
      }
      
      // Reset form
      setFormData({
        clientName: '',
        email: '',
        agentName: 'AI Assistant',
        agentDescription: '',
      });
      setLogoFile(null);
      setLogoPreview(null);
      
      // Navigate back to clients list
      navigate('/admin/clients');
      
    } catch (error: any) {
      console.error('Error creating client:', error);
      
      // Only update the toast if it's the same one we created
      if (toastShownRef.current === loadingToast) {
        toast.error(`Failed to create client: ${error.message}`, { id: loadingToast });
      } else {
        toast.error(`Failed to create client: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">Client Information</CardTitle>
        <CardDescription>Create a new client account and AI assistant</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* Client Information Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="clientName" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                Client Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="Enter client name"
                disabled={isSubmitting}
                className="transition-all focus-visible:ring-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                Email Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                disabled={isSubmitting}
                className="transition-all focus-visible:ring-primary"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">The welcome email and login details will be sent to this address</p>
            </div>
          </div>

          {/* AI Assistant Settings Section */}
          <div className="pt-4 border-t border-border">
            <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              AI Assistant Settings
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">AI Assistant Name</Label>
                <Input
                  id="agentName"
                  name="agentName"
                  value={formData.agentName}
                  onChange={handleChange}
                  placeholder="Enter AI assistant name"
                  disabled={isSubmitting}
                  className="transition-all focus-visible:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">Default is "AI Assistant" if left empty</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentDescription">AI Assistant Description</Label>
                <Textarea
                  id="agentDescription"
                  name="agentDescription"
                  value={formData.agentDescription}
                  onChange={handleChange}
                  placeholder="Describe what this AI assistant does and how it can help users"
                  disabled={isSubmitting}
                  className="resize-none min-h-[100px] transition-all focus-visible:ring-primary"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">This description helps define how your AI assistant interacts with users</p>
              </div>
            </div>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              AI Assistant Logo
            </Label>
            <div className="mt-2 flex items-center gap-4">
              {logoPreview ? (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-20 h-20 rounded-md object-cover border border-border shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs shadow-md hover:bg-destructive/90 transition-colors"
                    aria-label="Remove logo"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 flex flex-col items-center justify-center gap-1 border-dashed"
                >
                  <Upload className="h-5 w-5" />
                  <span className="text-xs">Upload</span>
                </Button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleLogoChange}
                accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                className="hidden"
              />
              <div className="text-sm text-muted-foreground">
                <p>Recommended: 512×512px</p>
                <p>Max size: 5MB</p>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-4 pt-4 border-t border-border mt-4">
          <Button type="submit" disabled={isSubmitting} className="transition-all">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Client
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/admin/clients')} disabled={isSubmitting}>
            Cancel
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
