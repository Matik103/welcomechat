
export interface WidgetSettings {
  appearance: {
    theme: 'light' | 'dark';
    chatBubbleColor: string;
    position: 'bottom-right' | 'bottom-left';
  };
  branding: {
    name: string;
    logo: string;
  };
}

export const defaultSettings: WidgetSettings = {
  appearance: {
    theme: 'light',
    chatBubbleColor: '#000000',
    position: 'bottom-right'
  },
  branding: {
    name: '',
    logo: ''
  }
};
