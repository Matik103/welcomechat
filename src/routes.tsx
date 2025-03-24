
import { RouteObject } from "react-router-dom";
import StorageBrowserPage from "@/pages/admin/StorageBrowser";
import AdminDashboardPage from "@/pages/admin/AdminDashboard";
import EditClientInfo from "@/pages/EditClientInfo";

export const appRoutes: RouteObject[] = [
  {
    path: "/admin/dashboard",
    element: <AdminDashboardPage />,
  },
  {
    path: "/admin/storage-browser",
    element: <StorageBrowserPage />,
  },
  {
    path: "/admin/clients/:id/edit-info",
    element: <EditClientInfo />,
  }
];
