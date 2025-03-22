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
      
      const logoHtmlCode = settings.logo_url ? 
        `<img src="${settings.logo_url}" alt="Chat" class="widget-logo" />` : 
        '';
      
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
      
      const embedCode = `<!-- Welcome.Chat Widget CSS -->
<link href="https://cdn.welcome.chat/widget.css" rel="stylesheet" />

<!-- Widget Configuration -->
<script>
    window.WelcomeChatWidgetConfig = {
        branding: {
            name: '${settings.agent_name || "Chat"}',
            logo: '${settings.logo_url}',
            welcomeText: '${settings.welcome_text}',
            responseTimeText: '${settings.response_time_text}'
        },
        style: {
            primaryColor: '${settings.chat_color}',
            secondaryColor: '${settings.secondary_color}',
            position: '${settings.position}',
            backgroundColor: '${settings.background_color}',
            fontColor: '${settings.text_color}',
            displayMode: '${settings.display_mode}'
        }
    };
</script>

<!-- Add custom CSS for the widget -->
<style>
${customCss}
</style>

<!-- Load Welcome.Chat Widget -->
<script type="module">
    import { createChat } from 'https://cdn.welcome.chat/widget.js';

    // Create the chat widget
    const chatWidget = createChat({
        apiEndpoint: '${chatApiEndpoint}'
    });

    // Add event listener to handle expand/collapse
    document.addEventListener('DOMContentLoaded', () => {
        const chatWidgetElement = document.querySelector('.welcome-chat-widget');
        const chatIcon = document.querySelector('.chat-icon');
        const chatContent = document.createElement('div');
        chatContent.classList.add('chat-content');
        
        // Add logo if available - use predefined variable
        chatContent.innerHTML = \`
            <div class="chat-header">
                ${logoHtmlCode}
                <span class="chat-title">${settings.agent_name || "Chat"}</span>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input">
                <input type="text" placeholder="Type your message..." />
                <button class="send-button">Send</button>
            </div>
        \`;
        
        chatWidgetElement.appendChild(chatContent);

        chatWidgetElement.addEventListener('click', (e) => {
            // Only toggle expanded if clicking directly on the widget or icon, not on chat content
            if (e.target === chatWidgetElement || e.target === chatIcon) {
                chatWidgetElement.classList.toggle('expanded');
            }
        });
        
        // Add double-click to cycle through icon sizes
        chatWidgetElement.addEventListener('dblclick', (e) => {
            if (!chatWidgetElement.classList.contains('expanded')) {
                // Prevent expansion on double-click
                e.stopPropagation();
                
                // Cycle through icon sizes
                if (chatIcon.classList.contains('medium')) {
                    chatIcon.classList.remove('medium');
                    chatIcon.classList.add('large');
                } else if (chatIcon.classList.contains('large')) {
                    chatIcon.classList.remove('large');
                } else {
                    chatIcon.classList.add('medium');
                }
            }
        });
    });
</script>

<!-- HTML for the chat widget -->
${widgetHtml}`;

      navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast.success("Code copied! 📋", {
        description: "The widget code has been copied to your clipboard."
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
    return `    /* Chat container styling */
    .welcome-chat-widget {
        position: fixed;
        ${settings.position}: 20px;
        bottom: 20px;
        z-index: 9999;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${settings.chat_color};
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    /* When the chat is expanded */
    .welcome-chat-widget.expanded {
        width: 350px; /* Adjust the width for the expanded chat */
        height: 400px; /* Adjust the height for the expanded chat */
        border-radius: 10px;
        bottom: 30px;
        ${settings.position}: 30px;
    }

    /* Chat content inside the widget */
    .welcome-chat-widget .chat-content {
        display: none;
        flex-direction: column;
        width: 100%;
        height: 100%;
        padding: 10px;
        background-color: ${settings.background_color};
        border-radius: 10px;
    }

    /* When chat is expanded, show chat content */
    .welcome-chat-widget.expanded .chat-content {
        display: flex;
    }

    /* Icon for the collapsed state */
    .welcome-chat-widget .chat-icon {
        font-size: 30px;
        color: white;
    }
    
    /* You can cycle between icon sizes by double-clicking */
    .welcome-chat-widget .chat-icon.medium {
        font-size: 38px;
    }
    
    .welcome-chat-widget .chat-icon.large {
        font-size: 46px;
    }`;
  };
  
  const generateFloatingHtml = (settings: WidgetSettings) => {
    return `<div class="welcome-chat-widget">
    <div class="chat-icon">💬</div>
</div>`;
  };
  
  const generateInlineCss = (settings: WidgetSettings) => {
    return `    /* Inline chat widget container */
    .welcome-chat-inline-container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* Chat header */
    .welcome-chat-inline-header {
        background-color: ${settings.chat_color};
        color: white;
        padding: 12px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .welcome-chat-inline-header img.widget-logo {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: contain;
    }

    /* Chat messages container */
    .welcome-chat-inline-messages {
        height: 250px;
        overflow-y: auto;
        padding: 12px;
        background-color: ${settings.background_color};
    }

    /* Chat input container */
    .welcome-chat-inline-input {
        display: flex;
        padding: 8px;
        background-color: ${settings.secondary_color};
        border-top: 1px solid #e5e7eb;
    }

    .welcome-chat-inline-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        margin-right: 8px;
    }

    .welcome-chat-inline-input button {
        background-color: ${settings.chat_color};
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
    }

    .welcome-chat-inline-input button:hover {
        opacity: 0.9;
    }`;
  };
  
  const generateInlineHtml = (settings: WidgetSettings) => {
    const logoHtml = settings.logo_url ? 
      `<img src="${settings.logo_url}" alt="${settings.agent_name || 'Chat'}" class="widget-logo" />` : 
      '';
      
    return `<div class="welcome-chat-inline-container" id="welcome-chat-inline">
    <div class="welcome-chat-inline-header">
        ${logoHtml}
        <span>${settings.agent_name || 'Chat'}</span>
    </div>
    <div class="welcome-chat-inline-messages">
        <!-- Messages will appear here -->
    </div>
    <div class="welcome-chat-inline-input">
        <input type="text" placeholder="Type your message..." />
        <button>Send</button>
    </div>
</div>`;
  };
  
  const generateSidebarCss = (settings: WidgetSettings) => {
    return `    /* Sidebar chat widget */
    .welcome-chat-sidebar {
        position: fixed;
        top: 0;
        ${settings.position}: 0;
        height: 100vh;
        width: 80px;
        transition: width 0.3s ease;
        z-index: 9998;
        display: flex;
        flex-direction: column;
    }

    .welcome-chat-sidebar.expanded {
        width: 320px;
    }

    /* Tab that shows at the side */
    .welcome-chat-sidebar-tab {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        ${settings.position === 'right' ? 'left' : 'right'}: -40px;
        width: 40px;
        height: 80px;
        background-color: ${settings.chat_color};
        border-radius: ${settings.position === 'right' ? '8px 0 0 8px' : '0 8px 8px 0'};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: white;
    }

    /* Main sidebar content */
    .welcome-chat-sidebar-content {
        width: 100%;
        height: 100%;
        background-color: ${settings.background_color};
        border-${settings.position === 'right' ? 'left' : 'right'}: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    /* Header section */
    .welcome-chat-sidebar-header {
        padding: 16px;
        background-color: ${settings.chat_color};
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .welcome-chat-sidebar-header img.widget-logo {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        object-fit: contain;
    }

    /* Messages container */
    .welcome-chat-sidebar-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
    }

    /* Input area */
    .welcome-chat-sidebar-input {
        padding: 12px;
        display: flex;
        border-top: 1px solid #e5e7eb;
        background-color: ${settings.secondary_color};
    }

    .welcome-chat-sidebar-input input {
        flex: 1;
        padding: 8px 12px;
        border: 1px solid #d1d5db;
        border-radius: 4px;
        margin-right: 8px;
    }

    .welcome-chat-sidebar-input button {
        background-color: ${settings.chat_color};
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 12px;
        cursor: pointer;
    }

    /* Initially hide content until expanded */
    .welcome-chat-sidebar:not(.expanded) .welcome-chat-sidebar-header,
    .welcome-chat-sidebar:not(.expanded) .welcome-chat-sidebar-messages,
    .welcome-chat-sidebar:not(.expanded) .welcome-chat-sidebar-input {
        display: none;
    }`;
  };
  
  const generateSidebarHtml = (settings: WidgetSettings) => {
    const logoHtml = settings.logo_url ? 
      `<img src="${settings.logo_url}" alt="${settings.agent_name || 'Chat'}" class="widget-logo" />` : 
      '';
      
    return `<div class="welcome-chat-sidebar" id="welcome-chat-sidebar">
    <div class="welcome-chat-sidebar-tab">💬</div>
    <div class="welcome-chat-sidebar-content">
        <div class="welcome-chat-sidebar-header">
            ${logoHtml}
            <span>${settings.agent_name || 'Chat'}</span>
        </div>
        <div class="welcome-chat-sidebar-messages">
            <!-- Messages will appear here -->
        </div>
        <div class="welcome-chat-sidebar-input">
            <input type="text" placeholder="Type your message..." />
            <button>Send</button>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.getElementById('welcome-chat-sidebar');
        const sidebarTab = document.querySelector('.welcome-chat-sidebar-tab');
        
        sidebarTab.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
        });
    });
</script>`;
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
    
    const logoHtmlDisplay = settings.logo_url ? 
      `<img src="${settings.logo_url}" alt="${settings.agent_name || 'Chat'}" class="widget-logo" />` : 
      '';

    return `<!-- Welcome.Chat Widget CSS -->
<link href="https://cdn.welcome.chat/widget.css" rel="stylesheet" />

<!-- Widget Configuration -->
<script>
    window.WelcomeChatWidgetConfig = {
        branding: {
            name: '${settings.agent_name || "Chat"}',
            logo: '${settings.logo_url}',
            welcomeText: '${settings.welcome_text}',
            responseTimeText: '${settings.response_time_text}'
        },
        style: {
            primaryColor: '${settings.chat_color}',
            secondaryColor: '${settings.secondary_color}',
            position: '${settings.position}',
            backgroundColor: '${settings.background_color}',
            fontColor: '${settings.text_color}',
            displayMode: '${settings.display_mode}'
        }
    };
</script>

<!-- Add custom CSS for the widget -->
<style>
${customCss}
</style>

<!-- Load Welcome.Chat Widget -->
<script type="module">
    import { createChat } from 'https://cdn.welcome.chat/widget.js';

    // Create the chat widget with the assistant
    const chatWidget = createChat({
        apiEndpoint: 'https://${projectRef}.supabase.co/functions/v1/chat'
    });

    // Add event listener to handle expand/collapse
    document.addEventListener('DOMContentLoaded', () => {
        // Setup listeners based on the display mode
        if ('${settings.display_mode}' === 'floating') {
            const chatWidgetElement = document.querySelector('.welcome-chat-widget');
            const chatIcon = document.querySelector('.chat-icon');
            const chatContent = document.createElement('div');
            chatContent.classList.add('chat-content');
            
            // Add logo if available
            const logoHtml = '${settings.logo_url ? `<img src="${settings.logo_url}" alt="${settings.agent_name || 'Chat'}" class="widget-logo" />` : ''}';
            
            chatContent.innerHTML = \`
                <div class="chat-header">
                    ${logoHtmlDisplay}
                    <span class="chat-title">${settings.agent_name || "Chat"}</span>
                </div>
                <div class="chat-messages"></div>
                <div class="chat-input">
                    <input type="text" placeholder="Type your message..." />
                    <button class="send-button">Send</button>
                </div>
            \`;
            
            chatWidgetElement.appendChild(chatContent);

            chatWidgetElement.addEventListener('click', (e) => {
                // Only toggle expanded if clicking directly on the widget or icon
                if (e.target === chatWidgetElement || e.target === chatIcon) {
                    chatWidgetElement.classList.toggle('expanded');
                }
            });
            
            // Add double-click to cycle through icon sizes
            chatIcon.addEventListener('dblclick', (e) => {
                if (!chatWidgetElement.classList.contains('expanded')) {
                    // Prevent expansion on double-click
                    e.stopPropagation();
                    
                    // Cycle through icon sizes
                    if (chatIcon.classList.contains('medium')) {
                        chatIcon.classList.remove('medium');
                        chatIcon.classList.add('large');
                    } else if (chatIcon.classList.contains('large')) {
                        chatIcon.classList.remove('large');
                    } else {
                        chatIcon.classList.add('medium');
                    }
                }
            });
        } else if ('${settings.display_mode}' === 'sidebar') {
            const sidebar = document.getElementById('welcome-chat-sidebar');
            const sidebarTab = document.querySelector('.welcome-chat-sidebar-tab');
            
            sidebarTab.addEventListener('click', () => {
                sidebar.classList.toggle('expanded');
            });
        }
    });
</script>

<!-- HTML for the chat widget -->
${widgetHtml}`;
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
