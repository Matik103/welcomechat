
import { RouteObject } from "react-router-dom";
import StorageBrowserPage from "@/pages/admin/StorageBrowser";

export const appRoutes: RouteObject[] = [
  {
    path: "/admin/storage-browser",
    element: <StorageBrowserPage />,
  }
];
