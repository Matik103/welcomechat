import * as React from 'react'

// Common props that should be available on all components
interface CommonProps {
  className?: string
  children?: React.ReactNode
}

// Extend component props with common props
type ExtendedProps<T> = T & CommonProps

// Re-export component props with proper types
declare module '@/components/ui/accordion' {
  export interface AccordionProps extends CommonProps {
    type?: 'single' | 'multiple'
    value?: string
    defaultValue?: string
    collapsible?: boolean
  }
}

declare module '@/components/ui/alert-dialog' {
  export interface AlertDialogProps extends CommonProps {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
  }
}

declare module '@/components/ui/avatar' {
  export interface AvatarProps extends CommonProps {
    src?: string
    alt?: string
    fallback?: React.ReactNode
  }
  
  export interface AvatarImageProps extends CommonProps {
    src?: string
    alt?: string
    onError?: React.ReactEventHandler<HTMLImageElement>
  }
  
  export interface AvatarFallbackProps extends CommonProps {
    delayMs?: number
  }
}

declare module '@/components/ui/label' {
  export interface LabelProps extends CommonProps {
    htmlFor?: string
  }
}

declare module '@/components/ui/tabs' {
  export interface TabsProps extends CommonProps {
    defaultValue?: string
    value?: string
    onValueChange?: (value: string) => void
  }
}

declare module '@/components/ui/progress' {
  export interface ProgressProps extends CommonProps {
    value?: number
    max?: number
  }
}

declare module '@/components/ui/card' {
  export interface CardProps extends CommonProps {}
  export interface CardHeaderProps extends CommonProps {}
  export interface CardTitleProps extends CommonProps {}
  export interface CardDescriptionProps extends CommonProps {}
  export interface CardContentProps extends CommonProps {}
  export interface CardFooterProps extends CommonProps {}
}

declare module '@/components/ui/button' {
  export interface ButtonProps extends CommonProps {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
    onClick?: () => void
    disabled?: boolean
  }
}

declare module '@/components/ui/badge' {
  export interface BadgeProps extends CommonProps {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  }
}

declare module '@/components/ui/select' {
  export interface SelectProps extends CommonProps {
    value?: string
    defaultValue?: string
    onValueChange?: (value: string) => void
    disabled?: boolean
  }
  
  export interface SelectTriggerProps extends CommonProps {}
  export interface SelectValueProps extends CommonProps {}
  export interface SelectContentProps extends CommonProps {}
  export interface SelectItemProps extends CommonProps {
    value: string
  }
}

// Add more component type declarations as needed 