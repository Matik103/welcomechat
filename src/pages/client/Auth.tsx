
import { Navigate } from "react-router-dom";

export default function ClientAuth() {
  // Redirect to the main auth page since we no longer have client-specific auth
  return <Navigate to="/auth" replace />;
}
