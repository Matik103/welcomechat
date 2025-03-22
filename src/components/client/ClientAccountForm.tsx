
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { generateTempPassword, saveClientTempPassword, logClientCreationActivity } from '@/utils/clientCreationUtils';

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
      // Generate a temporary password - explicitly typed as string
      const tempPassword = generateTempPassword();
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="clientName">Client Name *</Label>
          <Input
            id="clientName"
            name="clientName"
            value={formData.clientName}
            onChange={handleChange}
            placeholder="Enter client name"
            disabled={isSubmitting}
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter email address"
            disabled={isSubmitting}
            required
          />
          <p className="text-xs text-gray-500 mt-1">The welcome email and login details will be sent to this address</p>
        </div>

        <div className="pt-4 border-t">
          <h3 className="text-lg font-medium mb-4">AI Assistant Settings</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="agentName">AI Assistant Name</Label>
              <Input
                id="agentName"
                name="agentName"
                value={formData.agentName}
                onChange={handleChange}
                placeholder="Enter AI assistant name"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">Default is "AI Assistant" if left empty</p>
            </div>

            <div>
              <Label htmlFor="agentDescription">AI Assistant Description</Label>
              <Textarea
                id="agentDescription"
                name="agentDescription"
                value={formData.agentDescription}
                onChange={handleChange}
                placeholder="Describe what this AI assistant does and how it can help users"
                disabled={isSubmitting}
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">This description helps define how your AI assistant interacts with users</p>
            </div>
          </div>
        </div>

        <div>
          <Label>AI Assistant Logo</Label>
          <div className="mt-2 flex items-center gap-4">
            {logoPreview ? (
              <div className="relative inline-block">
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="w-16 h-16 rounded object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs shadow-md"
                >
                  ✕
                </button>
              </div>
            ) : (
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="h-16 w-16 flex flex-col items-center justify-center gap-1 border-dashed"
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
            <div className="text-sm text-gray-500">
              <p>Recommended: 512×512px</p>
              <p>Max size: 5MB</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Client
        </Button>
        <Button type="button" variant="outline" onClick={() => navigate('/admin/clients')} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
