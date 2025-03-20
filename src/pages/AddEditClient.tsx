
import { Navigate } from "react-router-dom";

export default function AddEditClient() {
  // Redirect to 404 since client pages no longer exist
  return <Navigate to="/404" replace />;
}
