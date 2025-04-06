
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { WidgetSettings } from "@/types/widget-settings";
import { toast } from "sonner";
import { SUPABASE_URL } from "@/integrations/supabase/client";
import { useEffect, useRef, useState } from "react";

interface EmbedCodeProps {
  settings: WidgetSettings;
  onCopy?: () => void;
}

export function EmbedCode({ settings, onCopy }: EmbedCodeProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  
  const projectRef = SUPABASE_URL.split("https://")[1]?.split(".supabase.co")[0];

  useEffect(() => {
    if (codeRef.current) {
      const keywords = ["window", "script", "const", "let", "var", "function", "return", "new", "true", "false", "import", "from", "document", "addEventListener", "querySelector", "createElement", "appendChild", "classList", "toggle", "add"];
      let html = codeRef.current.innerHTML;
      
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        html = html.replace(regex, `<span class="text-purple-600">${keyword}</span>`);
      });
      
      html = html.replace(/"(.*?)"/g, '<span class="text-green-600">"$1"</span>');
      
      html = html.replace(/(\w+):/g, '<span class="text-blue-600">$1</span>:');
      
      codeRef.current.innerHTML = html;
    }
  }, [settings]);

  const handleCopyCode = () => {
    try {
      const chatApiEndpoint = `https://${projectRef}.supabase.co/functions/v1/chat`;
      
      let customCss = '';
      let widgetHtml = '';
      
      switch(settings.display_mode) {
        case 'inline':
          customCss = generateInlineCss(settings);
          widgetHtml = generateInlineHtml(settings);
          break;
        case 'sidebar':
          customCss = generateSidebarCss(settings);
          widgetHtml = generateSidebarHtml(settings);
          break;
        case 'floating':
        default:
          customCss = generateFloatingCss(settings);
          widgetHtml = generateFloatingHtml(settings);
          break;
      }
      
      const embedCode = `<!-- Welcome.Chat Widget Code -->
<!-- Add this code to your website where you want the chat widget to appear -->

<!-- Widget Configuration -->
<script>
  window.WelcomeChatConfig = {
    branding: {
      name: "${settings.agent_name || "AI Assistant"}",
      logo: "${settings.logo_url}",
      welcomeText: "${settings.welcome_text || "Welcome to our assistant"}",
      responseTimeText: "${settings.response_time_text || "Typically responds in a few seconds"}"
    },
    style: {
      primaryColor: "${settings.chat_color || "#4F46E5"}",
      secondaryColor: "${settings.secondary_color || "#6366F1"}",
      position: "${settings.position || "right"}",
      backgroundColor: "${settings.background_color || "#FFFFFF"}",
      fontColor: "${settings.text_color || "#1F2937"}",
      displayMode: "${settings.display_mode || "floating"}"
    },
    apiEndpoint: "${chatApiEndpoint}"
  };
</script>

<!-- Widget Styles -->
<style>
${customCss}
</style>

<!-- Widget HTML Structure -->
${widgetHtml}

<!-- Widget Functionality -->
<script>
  document.addEventListener("DOMContentLoaded", function() {
    // Initialize the chat widget based on display mode
    const config = window.WelcomeChatConfig;
    const mode = config.style.displayMode;
    
    if (mode === "floating") {
      initFloatingWidget();
    } else if (mode === "sidebar") {
      initSidebarWidget();
    } else if (mode === "inline") {
      initInlineWidget();
    }
    
    // Initialize the floating bubble widget
    function initFloatingWidget() {
      const widget = document.querySelector(".welcome-chat-widget");
      const chatIcon = document.querySelector(".chat-icon");
      
      if (!widget) return;
      
      // Create chat content container if it doesn't exist
      if (!widget.querySelector(".chat-content")) {
        const content = document.createElement("div");
        content.className = "chat-content";
        content.innerHTML = \`
          <div class="chat-header" style="background-color: \${config.style.primaryColor}">
            \${config.branding.logo ? \`<img src="\${config.branding.logo}" class="widget-logo" alt="\${config.branding.name}">\` : ''}
            <span>\${config.branding.name}</span>
          </div>
          <div class="chat-messages"></div>
          <div class="chat-input">
            <input type="text" placeholder="Type your message...">
            <button style="background-color: \${config.style.primaryColor}">Send</button>
          </div>
        \`;
        widget.appendChild(content);
      }
      
      // Toggle chat open/closed when clicking the widget
      widget.addEventListener("click", function(e) {
        if (e.target === widget || e.target === chatIcon || e.target.closest(".chat-icon")) {
          widget.classList.toggle("expanded");
        }
      });
      
      // Handle sending messages
      const input = widget.querySelector("input");
      const sendButton = widget.querySelector("button");
      const messagesContainer = widget.querySelector(".chat-messages");
      
      if (input && sendButton && messagesContainer) {
        const sendMessage = function() {
          const message = input.value.trim();
          if (!message) return;
          
          // Add user message
          const userMsg = document.createElement("div");
          userMsg.className = "user-message";
          userMsg.textContent = message;
          userMsg.style.backgroundColor = config.style.primaryColor;
          messagesContainer.appendChild(userMsg);
          
          input.value = "";
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          
          // Simulate assistant response (in a real implementation, this would call your API)
          setTimeout(function() {
            const assistantMsg = document.createElement("div");
            assistantMsg.className = "assistant-message";
            assistantMsg.textContent = config.branding.welcomeText;
            messagesContainer.appendChild(assistantMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }, 1000);
        };
        
        sendButton.addEventListener("click", sendMessage);
        input.addEventListener("keypress", function(e) {
          if (e.key === "Enter") sendMessage();
        });
      }
    }
    
    // Initialize the sidebar widget
    function initSidebarWidget() {
      const sidebar = document.getElementById("welcome-chat-sidebar");
      const sidebarTab = sidebar?.querySelector(".welcome-chat-sidebar-tab");
      
      if (sidebar && sidebarTab) {
        sidebarTab.addEventListener("click", function() {
          sidebar.classList.toggle("expanded");
        });
      }
    }
    
    // Initialize the inline widget
    function initInlineWidget() {
      const widget = document.getElementById("welcome-chat-inline");
      const input = widget?.querySelector("input");
      const sendButton = widget?.querySelector("button");
      const messagesContainer = widget?.querySelector(".welcome-chat-inline-messages");
      
      if (input && sendButton && messagesContainer) {
        const sendMessage = function() {
          const message = input.value.trim();
          if (!message) return;
          
          // Add user message
          const userMsg = document.createElement("div");
          userMsg.className = "user-message";
          userMsg.textContent = message;
          userMsg.style.backgroundColor = config.style.primaryColor;
          messagesContainer.appendChild(userMsg);
          
          input.value = "";
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          
          // Simulate assistant response
          setTimeout(function() {
            const assistantMsg = document.createElement("div");
            assistantMsg.className = "assistant-message";
            assistantMsg.textContent = config.branding.welcomeText;
            messagesContainer.appendChild(assistantMsg);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
          }, 1000);
        };
        
        sendButton.addEventListener("click", sendMessage);
        input.addEventListener("keypress", function(e) {
          if (e.key === "Enter") sendMessage();
        });
      }
    }
  });
</script>`;

      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast.success("Code copied to clipboard! 📋", {
        description: "Paste this code into your website to add the chat widget."
      });
      
      if (onCopy) {
        onCopy();
      }
    } catch (error) {
      console.error("Failed to copy code:", error);
      toast.error("Copy failed", {
        description: "Could not copy code to clipboard. Please try again."
      });
    }
  };
  
  const generateFloatingCss = (settings: WidgetSettings) => {
    return `/* Floating Chat Widget Styles */
.welcome-chat-widget {
  position: fixed;
  ${settings.position || "right"}: 20px;
  bottom: 20px;
  z-index: 9999;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: ${settings.chat_color || "#4F46E5"};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.welcome-chat-widget .chat-icon {
  font-size: 30px;
  color: white;
}

.welcome-chat-widget.expanded {
  width: 350px;
  height: 500px;
  border-radius: 10px;
  bottom: 30px;
  ${settings.position || "right"}: 30px;
}

.welcome-chat-widget .chat-content {
  display: none;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  overflow: hidden;
  background-color: ${settings.background_color || "#FFFFFF"};
}

.welcome-chat-widget.expanded .chat-content {
  display: flex;
}

.welcome-chat-widget.expanded .chat-icon {
  display: none;
}

.welcome-chat-widget .chat-header {
  padding: 12px 16px;
  background-color: ${settings.chat_color || "#4F46E5"};
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}

.welcome-chat-widget .chat-header .widget-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: contain;
}

.welcome-chat-widget .chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.welcome-chat-widget .chat-messages .user-message,
.welcome-chat-widget .chat-messages .assistant-message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
  word-break: break-word;
}

.welcome-chat-widget .chat-messages .user-message {
  align-self: flex-end;
  background-color: ${settings.chat_color || "#4F46E5"};
  color: white;
}

.welcome-chat-widget .chat-messages .assistant-message {
  align-self: flex-start;
  background-color: ${settings.secondary_color || "#F3F4F6"};
  color: ${settings.text_color || "#1F2937"};
}

.welcome-chat-widget .chat-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #e5e7eb;
}

.welcome-chat-widget .chat-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  margin-right: 8px;
}

.welcome-chat-widget .chat-input button {
  background-color: ${settings.button_color || settings.chat_color || "#4F46E5"};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  cursor: pointer;
}`;
  };
  
  const generateFloatingHtml = (settings: WidgetSettings) => {
    return `<div class="welcome-chat-widget">
  <div class="chat-icon">💬</div>
</div>`;
  };
  
  const generateInlineCss = (settings: WidgetSettings) => {
    return `/* Inline Chat Widget Styles */
.welcome-chat-inline-container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.welcome-chat-inline-header {
  background-color: ${settings.chat_color || "#4F46E5"};
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.welcome-chat-inline-header .widget-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: contain;
}

.welcome-chat-inline-messages {
  height: 300px;
  overflow-y: auto;
  padding: 16px;
  background-color: ${settings.background_color || "#FFFFFF"};
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.welcome-chat-inline-messages .user-message,
.welcome-chat-inline-messages .assistant-message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
  word-break: break-word;
}

.welcome-chat-inline-messages .user-message {
  align-self: flex-end;
  background-color: ${settings.chat_color || "#4F46E5"};
  color: white;
}

.welcome-chat-inline-messages .assistant-message {
  align-self: flex-start;
  background-color: ${settings.secondary_color || "#F3F4F6"};
  color: ${settings.text_color || "#1F2937"};
}

.welcome-chat-inline-input {
  display: flex;
  padding: 10px;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.welcome-chat-inline-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  margin-right: 8px;
}

.welcome-chat-inline-input button {
  background-color: ${settings.button_color || settings.chat_color || "#4F46E5"};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  cursor: pointer;
}`;
  };
  
  const generateInlineHtml = (settings: WidgetSettings) => {
    const logoHtml = settings.logo_url ? 
      `<img src="${settings.logo_url}" alt="${settings.agent_name || 'AI Assistant'}" class="widget-logo" />` : 
      '';
      
    return `<div class="welcome-chat-inline-container" id="welcome-chat-inline">
  <div class="welcome-chat-inline-header">
    ${logoHtml}
    <span>${settings.agent_name || 'AI Assistant'}</span>
  </div>
  <div class="welcome-chat-inline-messages">
    <!-- Messages will appear here -->
  </div>
  <div class="welcome-chat-inline-input">
    <input type="text" placeholder="${settings.greeting_message || 'Type your message...'}" />
    <button>Send</button>
  </div>
</div>`;
  };
  
  const generateSidebarCss = (settings: WidgetSettings) => {
    return `/* Sidebar Chat Widget Styles */
.welcome-chat-sidebar {
  position: fixed;
  top: 0;
  ${settings.position || "right"}: 0;
  height: 100vh;
  width: 80px;
  transition: width 0.3s ease;
  z-index: 9998;
  display: flex;
}

.welcome-chat-sidebar.expanded {
  width: 320px;
}

.welcome-chat-sidebar-tab {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${settings.position === 'right' ? 'left' : 'right'}: -40px;
  width: 40px;
  height: 120px;
  background-color: ${settings.chat_color || "#4F46E5"};
  border-radius: ${settings.position === 'right' ? '8px 0 0 8px' : '0 8px 8px 0'};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  writing-mode: ${settings.position === 'right' ? 'vertical-rl' : 'vertical-lr'};
  text-orientation: mixed;
  padding: 10px 0;
}

.welcome-chat-sidebar-content {
  width: 100%;
  height: 100%;
  background-color: ${settings.background_color || "#FFFFFF"};
  border-${settings.position === 'right' ? 'left' : 'right'}: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.welcome-chat-sidebar-header {
  padding: 12px 16px;
  background-color: ${settings.chat_color || "#4F46E5"};
  color: white;
  display: flex;
  align-items: center;
  gap: 10px;
}

.welcome-chat-sidebar-header .widget-logo {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: contain;
}

.welcome-chat-sidebar-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.welcome-chat-sidebar-messages .user-message,
.welcome-chat-sidebar-messages .assistant-message {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 18px;
  word-break: break-word;
}

.welcome-chat-sidebar-messages .user-message {
  align-self: flex-end;
  background-color: ${settings.chat_color || "#4F46E5"};
  color: white;
}

.welcome-chat-sidebar-messages .assistant-message {
  align-self: flex-start;
  background-color: ${settings.secondary_color || "#F3F4F6"};
  color: ${settings.text_color || "#1F2937"};
}

.welcome-chat-sidebar-input {
  padding: 10px;
  display: flex;
  border-top: 1px solid #e5e7eb;
  background-color: #f9fafb;
}

.welcome-chat-sidebar-input input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  margin-right: 8px;
}

.welcome-chat-sidebar-input button {
  background-color: ${settings.button_color || settings.chat_color || "#4F46E5"};
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 14px;
  cursor: pointer;
}

.welcome-chat-sidebar:not(.expanded) .welcome-chat-sidebar-header,
.welcome-chat-sidebar:not(.expanded) .welcome-chat-sidebar-messages,
.welcome-chat-sidebar:not(.expanded) .welcome-chat-sidebar-input {
  display: none;
}`;
  };
  
  const generateSidebarHtml = (settings: WidgetSettings) => {
    const logoHtml = settings.logo_url ? 
      `<img src="${settings.logo_url}" alt="${settings.agent_name || 'AI Assistant'}" class="widget-logo" />` : 
      '';
    
    const tabText = settings.agent_name || 'Chat with us';
      
    return `<div class="welcome-chat-sidebar" id="welcome-chat-sidebar">
  <div class="welcome-chat-sidebar-tab">${tabText}</div>
  <div class="welcome-chat-sidebar-content">
    <div class="welcome-chat-sidebar-header">
      ${logoHtml}
      <span>${settings.agent_name || 'AI Assistant'}</span>
    </div>
    <div class="welcome-chat-sidebar-messages">
      <!-- Messages will appear here -->
    </div>
    <div class="welcome-chat-sidebar-input">
      <input type="text" placeholder="${settings.greeting_message || 'Type your message...'}" />
      <button>Send</button>
    </div>
  </div>
</div>`;
  };
  
  const generateCodePreview = () => {
    let customCss = '';
    let widgetHtml = '';
    
    switch(settings.display_mode) {
      case 'inline':
        customCss = generateInlineCss(settings);
        widgetHtml = generateInlineHtml(settings);
        break;
      case 'sidebar':
        customCss = generateSidebarCss(settings);
        widgetHtml = generateSidebarHtml(settings);
        break;
      case 'floating':
      default:
        customCss = generateFloatingCss(settings);
        widgetHtml = generateFloatingHtml(settings);
        break;
    }
    
    return `<!-- Welcome.Chat Widget Code -->
<!-- Add this code to your website where you want the chat widget to appear -->

<!-- Widget Configuration -->
<script>
  window.WelcomeChatConfig = {
    branding: {
      name: "${settings.agent_name || "AI Assistant"}",
      logo: "${settings.logo_url}",
      welcomeText: "${settings.welcome_text || "Welcome to our assistant"}",
      responseTimeText: "${settings.response_time_text || "Typically responds in a few seconds"}"
    },
    style: {
      primaryColor: "${settings.chat_color || "#4F46E5"}",
      secondaryColor: "${settings.secondary_color || "#6366F1"}",
      position: "${settings.position || "right"}",
      backgroundColor: "${settings.background_color || "#FFFFFF"}",
      fontColor: "${settings.text_color || "#1F2937"}",
      displayMode: "${settings.display_mode || "floating"}"
    },
    apiEndpoint: "https://${projectRef}.supabase.co/functions/v1/chat"
  };
</script>

<!-- Widget Styles -->
<style>
${customCss}
</style>

<!-- Widget HTML Structure -->
${widgetHtml}

<!-- Widget Functionality Script -->
<script>
  document.addEventListener("DOMContentLoaded", function() {
    const config = window.WelcomeChatConfig;
    // Widget initialization logic will run here
  });
</script>`;
  };
  
  return (
    <div className="relative">
      <pre 
        ref={codeRef}
        className="p-4 bg-gray-50 rounded-lg text-sm overflow-x-auto border border-gray-200 max-h-[300px] font-mono"
      >
        {generateCodePreview()}
      </pre>
      <Button
        size="sm"
        onClick={handleCopyCode}
        className="absolute top-2 right-2 bg-indigo-600 hover:bg-indigo-700"
      >
        <Copy className="w-4 h-4 mr-2" />
        {copied ? "Copied!" : "Copy Code"}
      </Button>
    </div>
  );
}
