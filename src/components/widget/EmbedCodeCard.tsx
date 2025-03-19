
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { toast } from "sonner";

interface EmbedCodeCardProps {
  settings: WidgetSettings;
  onCopy?: () => void;
}

export function EmbedCodeCard({ settings, onCopy }: EmbedCodeCardProps) {
  const [hasCopied, setHasCopied] = useState(false);

  // Generate embed code
  const generateEmbedCode = () => {
    // Create a complete embed code with all settings
    const embedCode = `<script>
  // Welcome.Chat Widget Config
  window.welcomeChatConfig = {
    agent_name: "${settings.agent_name || 'AI Assistant'}",
    logo_url: "${settings.logo_url || ''}",
    chat_color: "${settings.chat_color || '#854fff'}",
    background_color: "${settings.background_color || '#ffffff'}",
    text_color: "${settings.text_color || '#333333'}",
    secondary_color: "${settings.secondary_color || '#6b3fd4'}",
    position: "${settings.position || 'right'}",
    welcome_text: "${settings.welcome_text || 'Hi 👋, how can I help?'}",
    response_time_text: "${settings.response_time_text || 'I typically respond right away'}"
  };

  // Load the Welcome.Chat widget script
  (function(w,d,s,o){
    var f=d.getElementsByTagName(s)[0];
    var j=d.createElement(s);
    j.async=true;
    j.src='https://cdn.welcome.chat/widget.js';
    j.onload = function() {
      console.log('Welcome.Chat widget loaded successfully');
    };
    f.parentNode.insertBefore(j,f);
  })(window,document,'script');
</script>`;

    return embedCode;
  };

  const handleCopyCode = async () => {
    try {
      const embedCode = generateEmbedCode();
      await navigator.clipboard.writeText(embedCode);
      setHasCopied(true);
      toast.success("Embed code copied to clipboard!");
      
      if (onCopy) {
        onCopy();
      }
      
      setTimeout(() => {
        setHasCopied(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to copy embed code:", error);
      toast.error("Failed to copy embed code. Please try again.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Embed Code</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
            {generateEmbedCode()}
          </pre>
          <Button
            className="absolute top-3 right-3"
            size="sm"
            variant="ghost"
            onClick={handleCopyCode}
          >
            {hasCopied ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Add this code to your website to display the chat widget. It should be placed right before the closing <code>&lt;/body&gt;</code> tag.
        </p>
      </CardContent>
    </Card>
  );
}
