
import { Navigate } from "react-router-dom";

export default function WidgetSettings() {
  // Redirect to 404 since widget settings page no longer exists
  return <Navigate to="/404" replace />;
}
