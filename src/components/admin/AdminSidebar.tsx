
import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Users,
  LayoutDashboard,
  UserCog,
  FileText,
  Settings,
  MoveUp,
  BarChart3,
  FilePlus,
  Building,
} from 'lucide-react';

const AdminSidebar = () => {
  return (
    <div className="flex flex-col h-full bg-primary-foreground/20 border-r">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Admin Portal</h2>
      </div>
      <nav className="flex-1 p-2 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive 
                      ? 'bg-muted text-primary' 
                      : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                  )
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const navItems = [
  {
    to: '/admin',
    label: 'Dashboard',
    icon: <LayoutDashboard size={18} />,
  },
  {
    to: '/admin/agents',
    label: 'Agents',
    icon: <Users size={18} />,
  },
  {
    to: '/admin/clients',
    label: 'Clients',
    icon: <Building size={18} />,
  },
  {
    to: '/admin/users',
    label: 'Users',
    icon: <UserCog size={18} />,
  },
  {
    to: '/admin/logs',
    label: 'Logs',
    icon: <FileText size={18} />,
  },
  {
    to: '/admin/migrations',
    label: 'Migrations',
    icon: <MoveUp size={18} />,
  },
  {
    to: '/admin/analytics',
    label: 'Analytics',
    icon: <BarChart3 size={18} />,
  },
  {
    to: '/admin/document-extraction',
    label: 'Document Extraction',
    icon: <FilePlus size={18} />,
  },
  {
    to: '/admin/settings',
    label: 'Settings',
    icon: <Settings size={18} />,
  },
];

export default AdminSidebar;
