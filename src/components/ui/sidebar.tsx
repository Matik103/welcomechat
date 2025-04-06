
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface SidebarHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface SidebarNavItemProps extends React.HTMLAttributes<HTMLAnchorElement> {
  children: React.ReactNode;
  className?: string;
  href?: string;
  active?: boolean;
  icon?: LucideIcon;
  onClick?: () => void;
}

interface SidebarFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

interface SidebarCollapseToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  collapsed?: boolean;
  onClick?: () => void;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  (
    { children, className, collapsed = false, onCollapsedChange, ...props },
    ref
  ) => {
    const [localCollapsed, setLocalCollapsed] = useState(collapsed);
    
    const isCollapsed = collapsed ?? localCollapsed;

    const handleCollapsedChange = () => {
      const newCollapsed = !isCollapsed;
      setLocalCollapsed(newCollapsed);
      onCollapsedChange?.(newCollapsed);
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col border-r bg-background h-full transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
        data-collapsed={isCollapsed}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child as React.ReactElement<any>, {
              collapsed: isCollapsed,
              onCollapsedChange: handleCollapsedChange,
            });
          }
          return child;
        })}
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<HTMLDivElement, SidebarHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-4 border-b', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarHeader.displayName = 'SidebarHeader';

const SidebarNav = React.forwardRef<HTMLDivElement, SidebarNavProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn('flex-1 overflow-y-auto py-2', className)}
        {...props}
      >
        <ul>{children}</ul>
      </nav>
    );
  }
);
SidebarNav.displayName = 'SidebarNav';

const SidebarNavItem = React.forwardRef<HTMLAnchorElement, SidebarNavItemProps>(
  ({ children, className, href, active, icon: Icon, onClick, ...props }, ref) => {
    const handleClick = (e: React.MouseEvent) => {
      if (onClick) {
        onClick();
      }
    };

    return (
      <li>
        <a
          ref={ref}
          href={href}
          onClick={handleClick}
          className={cn(
            'flex items-center py-2 px-4 text-foreground/70 hover:bg-accent hover:text-accent-foreground rounded-md mx-2 transition-all',
            active && 'bg-accent text-accent-foreground font-medium',
            className
          )}
          {...props}
        >
          {Icon && <Icon className="h-5 w-5 mr-2" />}
          <span>{children}</span>
        </a>
      </li>
    );
  }
);
SidebarNavItem.displayName = 'SidebarNavItem';

const SidebarFooter = React.forwardRef<HTMLDivElement, SidebarFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('p-4 border-t mt-auto', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarFooter.displayName = 'SidebarFooter';

const SidebarCollapseToggle = React.forwardRef<
  HTMLButtonElement,
  SidebarCollapseToggleProps
>(({ className, collapsed = false, onClick, ...props }, ref) => {
  return (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        'h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-all',
        className
      )}
      aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      {...props}
    >
      {collapsed ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      )}
    </button>
  );
});
SidebarCollapseToggle.displayName = 'SidebarCollapseToggle';

export {
  Sidebar,
  SidebarHeader,
  SidebarNav,
  SidebarNavItem,
  SidebarFooter,
  SidebarCollapseToggle,
};
