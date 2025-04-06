import * as React from 'react'
import { ReactNode } from 'react'

// Common props that should be available on all components
interface CommonProps {
  className?: string
  children?: ReactNode
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
    onValueChange?: (value: string) => void
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
    fallback?: ReactNode
  }
  
  export interface AvatarImageProps extends CommonProps {
    src?: string
    alt?: string
    onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void
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
    orientation?: 'horizontal' | 'vertical'
    dir?: 'ltr' | 'rtl'
    activationMode?: 'automatic' | 'manual'
  }
}

declare module '@/components/ui/progress' {
  export interface ProgressProps extends CommonProps {
    value?: number
    max?: number
    getValueLabel?: (value: number, max: number) => string
  }
}

declare module '@/components/ui/card' {
  export interface CardProps extends CommonProps {
    asChild?: boolean
  }
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
    asChild?: boolean
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    onClick?: () => void
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
    required?: boolean
    name?: string
  }
  
  export interface SelectTriggerProps extends CommonProps {}
  export interface SelectValueProps extends CommonProps {}
  export interface SelectContentProps extends CommonProps {}
  export interface SelectItemProps extends CommonProps {
    value: string
    disabled?: boolean
    textValue?: string
  }
}

declare module '@/components/ui/dialog' {
  export interface DialogProps extends CommonProps {
    open?: boolean
    defaultOpen?: boolean
    onOpenChange?: (open: boolean) => void
    modal?: boolean
  }
}

// Add more component type declarations as needed 