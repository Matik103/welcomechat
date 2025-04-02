
/**
 * Widget settings type definitions
 */

export interface DocumentMetadata {
  documentId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  url: string;
  aiProcessed?: boolean;
}

export interface WidgetSettings {
  appearance: {
    primaryColor?: string;
    secondaryColor?: string;
    buttonRadius?: string;
    fontFamily?: string;
    darkMode?: boolean;
  };
  behavior: {
    initialMessage?: string;
    position?: 'left' | 'right';
    autoOpen?: boolean;
    autoOpenDelay?: number;
    soundEffects?: boolean;
  };
  content: {
    widgetTitle?: string;
    widgetSubtitle?: string;
    agentName?: string;
    logoUrl?: string;
  };
  advanced: {
    customCss?: string;
    customJavaScript?: string;
    trackingEnabled?: boolean;
  };
  documents?: DocumentMetadata[];
}

export interface WidgetConfigProps {
  clientId: string;
  agentName?: string;
  settings: WidgetSettings;
  onSettingsUpdate: (settings: WidgetSettings) => Promise<void>;
}

export const defaultSettings: WidgetSettings = {
  appearance: {
    primaryColor: '#007bff',
    secondaryColor: '#6c757d',
    buttonRadius: '50%',
    fontFamily: 'Inter, sans-serif',
    darkMode: false,
  },
  behavior: {
    initialMessage: 'Hi there! How can I help you today?',
    position: 'right',
    autoOpen: false,
    autoOpenDelay: 3000,
    soundEffects: true,
  },
  content: {
    widgetTitle: 'Chat Assistant',
    widgetSubtitle: 'We typically reply within a few minutes',
    agentName: 'AI Assistant',
    logoUrl: '',
  },
  advanced: {
    customCss: '',
    customJavaScript: '',
    trackingEnabled: true,
  },
  documents: [],
};
