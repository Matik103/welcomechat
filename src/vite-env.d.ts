
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SUPABASE_SERVICE_ROLE_KEY: string
  readonly VITE_RESEND_API_KEY: string
  readonly VITE_LLAMA_CLOUD_API_KEY: string
  readonly VITE_LLAMA_EXTRACTION_AGENT_ID: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_ASSISTANT_ID: string
  readonly VITE_RAPIDAPI_KEY: string
  readonly VITE_RAPIDAPI_HOST: string
  readonly VITE_DEEPSEEK_API_KEY: string
  readonly MODE: string
  readonly PROD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// React 18 type augmentations
declare namespace React {
  interface CSSProperties {
    [key: `--${string}`]: string | number
  }
}

// BadgeProps interface extension to allow for children
declare module '@/components/ui/badge' {
  export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    children?: React.ReactNode
  }
}

// Fix for key props in component interfaces
declare module '@/components/widget/WidgetPreviewCard' {
  export interface WidgetPreviewProps {
    settings: WidgetSettings
    clientId: string
  }
}

declare module '@/components/widget/EmbedCodeCard' {
  export interface EmbedCodeProps {
    settings: WidgetSettings
    onCopy: () => void
  }
}

declare module '@/components/dashboard/ActivityItem' {
  export interface ActivityItemProps {
    item: Activity
  }
}

declare module '@/components/client-dashboard/InteractionStats' {
  export interface StatCardProps {
    title: string
    value: any
    isLoading: boolean
  }
}
