import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Settings,
  FileText,
  Database,
  HelpCircle,
} from "lucide-react";

export function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  return (
    <aside
      className={cn(
        "bg-gray-900 text-gray-300 w-64 flex-shrink-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-semibold">Admin Panel</span>
        </div>

        <nav className="space-y-1">
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )
            }
          >
            <LayoutDashboard className="mr-3 h-5 w-5 text-gray-400" />
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/clients"
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )
            }
          >
            <Users className="mr-3 h-5 w-5 text-gray-400" />
            Clients
          </NavLink>

          <NavLink
            to="/admin/document-extraction"
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )
            }
          >
            <FileText className="mr-3 h-5 w-5 text-gray-400" />
            Document Extraction
          </NavLink>

          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )
            }
          >
            <Settings className="mr-3 h-5 w-5 text-gray-400" />
            Settings
          </NavLink>

          <NavLink
            to="/admin/storage-browser"
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                isActive
                  ? "bg-gray-800 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              )
            }
          >
            <Database className="mr-3 h-5 w-5 text-gray-400" />
            Storage Browser
          </NavLink>
        </nav>
      </div>
    </aside>
  );
}
